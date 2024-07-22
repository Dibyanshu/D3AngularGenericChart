import * as d3 from 'd3';

export type LineOptions = {
    margin: { top: number, right: number, bottom: number, left: number };
    isVHetchingLine?: boolean;
    isTargetLine?: boolean;
    targetData?: {
        targetValue: number;
        targetColor: string;
    };
    isAutoScale?: boolean;
    legendData:{
            label: string;
            color: string;
        }[];
};
export type LineChartData = {
    labelBottom: string;
    labelTop?: string;
    value: number;
    color?: string;
    isComparison: boolean;
};
export type LineChartGroupData = {
    groupId: string; // unique id for the group @patern: [a-zA-Z0-9_]
    groupLabel: string;
    groupColor: LineChartColors;
    data: LineChartData[];
};
export type LineChartColors = {
    lineColor: string;
    areaColor: string; // area fill color will be gradient with secondary color as white
    dotColor: string;
};

export class LineChart {
    /*
    * @Constraint: The length of the data array should be the same for all the groups
    * @Constraint: For multiple lines X axis value should be same
    */
    groupData: LineChartGroupData[];

    private container: string;
    private defaultOptions: LineOptions = {
        margin: { top: 20, right: 20, bottom: 30, left: 50 },
        legendData: [
            { label: 'ISD', color: '#0F0E38' },
            { label: 'Cycle', color: '#B02A4C' }
        ]
    };
    private chartOptions: LineOptions;
    private height: number;
    private width: number;
    private svgElem: d3.Selection<SVGGElement, unknown, null, undefined>;
    private chartShiftX: number = 60;
    private groupColor: LineChartColors = {
        lineColor: '#B02A4C',
        areaColor: '#F9EEF1CC',
        dotColor: '#B02A4C'
    };
    private groupKey: string = 'groupId';

    constructor(container: string, groupData:LineChartGroupData[], options?: LineOptions) {
        this.chartOptions = { ...this.defaultOptions, ...options };
        this.container = container;
        this.groupData = groupData;
        this.render();
    }

    /**
     * Renders a chart within a specified container element, handling
     * dimensions, margins, and various chart options.
     * @param {boolean} [isInterim] - It indicates whether the rendering process is interim or not. If `isInterim` is `true`,
     * the function will return without performing the rendering actions, essentially skipping the
     * rendering process. This can be useful in scenarios
     * @returns If the `isInterim` parameter is true, the `render` function will return without performing
     * any further actions.
     */
    public render(isInterim?: boolean) {
        // Select the container element
        const containerElement = document.querySelector(this.container);
        const containerElemParent = document.querySelector(this.container).parentElement;

        // Set the dimensions and margins of the chart
        this.width = containerElemParent.clientWidth - this.chartOptions.margin.left - this.chartOptions.margin.right;
        this.height = containerElemParent.clientHeight - this.chartOptions.margin.top - this.chartOptions.margin.bottom; 

        // Remove existing chart if it exists
        if(isInterim){
            this.drawChartLines();
            return;
        }
        if (document.querySelector(`${this.container} > .chartWrapperG`)) {
            d3.select(`${this.container} > .chartWrapperG`).remove();
        }
        
        // Create the SVG element
        const svgWidth = this.width + this.chartOptions.margin.left + this.chartOptions.margin.right + this.chartShiftX + this.chartOptions.margin.left*2; // to add the y-axis labels
        const svgHeight = this.height + this.chartOptions.margin.top + this.chartOptions.margin.bottom + 60;
        this.svgElem = d3.select(containerElement)
            .attr("width", containerElemParent.clientWidth - this.chartOptions.margin.left - this.chartOptions.margin.right)
            .attr("height", svgHeight)
            .attr("viewBox", `0 0 ${svgWidth} ${svgHeight}`)
            .append("g")
            .attr("class", "chartWrapperG")
            .attr("transform", `translate(${this.chartOptions.margin.left+this.chartShiftX}, ${this.chartOptions.margin.top})`);
        
        this.addLinearGradient();
        this.dropShadowFilter();
        this.addLabels();
        
        this.drawChartLines();
        // Add grid lines
        this.addHetchingLines();
    }

    private drawChartLines() {
        /*
        * @Limitation: due to the multiple area fill gradient, 
        * we need to draw the higher x-axis value area first and then the lower x-axis value area
        * to avoid the overlapping of the area fill gradient 
        */
        this.groupData = this.groupData.sort((a, b) => {
            return d3.max(a.data, d => d.value) - d3.max(b.data, d => d.value);
        });
        this.groupData.forEach((group, index) => {
            this.groupColor = group.groupColor;
            this.groupKey = group.groupId;
            this.updateChart(group.data, index);
        });

        // @todo: Update the axes if autoScale is enabled
        /**
         * @explain: The axes should be updated only once for all the lines, 
         * because the x-axis value should be the same for all the lines
         * (for detail explanation check the constraints above)
         */
        const { yScale, xScale } = this.getScalesXY(this.groupData[0].data);
        this.drawAxes(xScale, yScale, this.groupData[0].data);
        this.drawLegends(xScale, yScale, this.chartOptions.legendData);
    }

    private drawLegends(xScale: d3.ScaleLinear<number, number, never>, yScale: d3.ScaleLinear<number, number, never>, legendData: { label: string; color: string; }[]) {
        // Add circular legends below x-axis
        if (this.svgElem.select(".legendWrapper").node()) {
            this.svgElem.select(".legendWrapper").remove();
        }
        const legendWrapper = this.svgElem.append("g")
            .attr("class", "legendWrapper");
            const spaceBetweenLegends = 140;
        legendData.forEach((legend, index) => {
            legendWrapper.append("circle")
                .attr("cx", index * spaceBetweenLegends)
                .attr("cy", 0)
                .attr("r", 6)
                .style("stroke", this.groupColor.dotColor)
                .style("stroke-width", "2px")
                .style('fill', 'white')
                .style("filter", "url(#drop-shadow)")
            legendWrapper.append("text")
                .attr("x", index * spaceBetweenLegends + 16)
                .attr("y", 5)
                .text(legend.label)
                .style("font-size", "14px")
                .style("fill", "#000000");
        });
        // center align the legendWrapper group
        const bbox = legendWrapper.node().getBBox();
        legendWrapper.attr("transform", `translate(${this.width / 2 - bbox.width / 2}, ${this.height + this.chartOptions.margin.top + 15})`);
    }

    private getScalesXY(lineData: LineChartData[]): { yScale: d3.ScaleLinear<number, number, never>; xScale: d3.ScaleLinear<number, number, never>; }{
        const xScale = d3.scaleLinear()
            .domain([0, lineData.length - 1])
            .range([0, this.width]);

        const yScale = d3.scaleLinear()
            // .domain([0, d3.max(this.data, d => d.value)]) // Auto scale enabler
            .domain([0, 100])
            .range([this.height, 0]);

        return { yScale, xScale };
    }

    private createLine(xScale: d3.ScaleLinear<number, number, never>, yScale: d3.ScaleLinear<number, number, never>) {
        return d3.line<LineChartData>()
        .x((d, i) => xScale(i))
        .y(d => yScale(d.value));
    }

    private drawDots(posX: any, posY: any, chartWrapperG: any, lineData: LineChartData[]) {
        chartWrapperG.append("g")
            .attr("class", "dotsWrapper")
            .selectAll('circle.dots')
            .data(lineData)
            .enter().append('circle')
            .attr("cx", posX) // minus it's width
            .attr("cy", posY)
            .attr('r', 6)
            .style("stroke", this.groupColor.dotColor)
            .style("stroke-width", "2px")
            .style('fill', 'white')
            .style("filter", "url(#drop-shadow)")
            .attr("class", "dots");
        // gets all the dots and do a for loop to get its data and append text
        const that = this;
        d3.selectAll("circle.dots").each(function(d, i){
            // d3 select this and get its parent and append text
            debugger;
            d3.select((this as any).parentElement).append("text")
                .text((d as any).value)
                .attr("x", posX(d, i))
                .attr("y", posY(d, i) - 10)
                .style("text-anchor", "middle")
                .style("fill", that.groupColor.dotColor);
        });
        
        chartWrapperG.selectAll("circle.dots", "text")
            .style("opacity", 0)
            .transition()
            .delay(function(d,i){ return i * (2500/lineData.length); })
            .ease(d3.easeLinear) // this has to check
            .duration(2500)
            .style("opacity", 1);
    }

    private drawAxes(xScale, yScale, lineData: LineChartData[]) {
        // check if the axis is already present
        if (this.svgElem.select(".x-axis").node() && this.svgElem.select(".y-axis").node()) {
            return;
        }
        // increase the xScale range by {this.chartShiftX} to shift the x-axis to the right
        xScale.range([this.chartShiftX, this.width + this.chartShiftX]);
        const xAxisGen = d3.axisBottom(xScale);
        xAxisGen.ticks(lineData.length);
        xAxisGen.tickSize(0);
        xAxisGen.tickPadding(25);
        // array of labels extract from data
        xAxisGen.tickFormat((d, i) => lineData[i].labelBottom);
        
        // xAxisGenerator.tickSize(-this.height);
        this.svgElem.append("g")
            .attr("class", "x-axis")
            .style("font-size", "14")
            .attr("color", "#000000")
            .attr("transform", `translate(0, ${this.height})`)
            .call(xAxisGen);

        // select all tick class inside x-axis and get data from the tick and append text
        //  rotate based on the data length {hardcoded value 15}
        const dataThresold = 15;
        const textRotation = lineData.length > dataThresold ? -45 : 0;
        const translateXVal = lineData.length > dataThresold ? 24 : 0;
        const translateYVal = lineData.length > dataThresold ? this.height + 20 : this.height;
        this.svgElem.select('.x-axis').selectAll(".tick").append("text").data(lineData)
            .text(d => d.labelTop)
            .style("fill", "black")
            .attr("y", -10)
            .attr("transform", `translate(${translateXVal}, -${translateYVal}) rotate(${textRotation})`);

        const yAxisGen = d3.axisLeft(yScale);
        // if autoScale is enabled then the ticks should be calculated based on the data
        if (this.chartOptions.isAutoScale) {
            yAxisGen.ticks(5);
        }
        else{
            yAxisGen.tickValues([0, 20, 40, 60, 80, 100]);
        }
        // yAxisGen fontSize
        yAxisGen.tickFormat(d => `${d}%`);
        yAxisGen.tickPadding(25);
        
        yAxisGen.tickSize(0);

        this.svgElem.append("g")
            .attr("class", "y-axis")
            .style("font-size", "14")
            .attr("color", "#000000")
            .call(yAxisGen);
        
        // select all axis and cjange color
        this.svgElem.select('.x-axis').selectAll("path").style("stroke", "#ddd").style("stroke-width", "2px");
        this.svgElem.select('.y-axis').selectAll("path").style("stroke", "#ddd").style("stroke-width", "2px");

        // get the x-axis path and clone it and append it. Increase the width of the path
        this.svgElem.select('.x-axis').select("path").clone()
            .attr("transform", `translate(-${this.chartShiftX}, 0)`)
            .style("stroke-width", 2)
            .style("stroke", "#ddd");
        this.svgElem.select('.x-axis').select("path").clone()
            .attr("transform", `translate(${this.chartShiftX*2}, 0)`)
            .style("stroke-width", 2)
            .style("stroke", "#ddd");
        this.svgElem.select('.y-axis').select("path").clone()
            .attr("transform", `translate(0, -${this.chartShiftX*2})`)
            .style("stroke-width", 2)
            .style("stroke", "#ddd");
    }

    /**
     * The function adds dashed horizontal lines to the x-axis ticks in an SVG element.
     */
    private addHetchingLines() {
        this.svgElem.selectAll(".x-axis .tick line")
            .attr("y1", -this.height)
            .style("stroke-width", 1)
            .style("stroke-dasharray", "5,5")
            .style("stroke", "#D8D8D8");
    }

    private updatePath(line, lineData: LineChartData[], chartWrapperG: d3.Selection<SVGGElement, unknown, HTMLElement, any>) {
        const updatedPath = d3
        .select(chartWrapperG.node())
        .select("path")
        .interrupt()
        .datum(lineData)
        .attr("class", "line")
        .style("stroke-width", 2)
        .style("fill", "none")
        .style("stroke", this.groupColor.lineColor)
        .attr("d", line);

        const pathLength = (updatedPath.node() as any).getTotalLength();
        // https://github.com/d3/d3-transition
        const transitionPath = d3
        .transition()
        .ease(d3.easeSin)
        .duration(2500);
        updatedPath
        .attr("stroke-dashoffset", pathLength)
        .attr("stroke-dasharray", pathLength)
        .transition(transitionPath)
        .attr("stroke-dashoffset", 0);

    }

    /**
     * Appends a text element to the SVG element for displaying y-axis plot label
     */
    private addLabels() {
        this.svgElem.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - this.chartOptions.margin.left*2)
            .attr("x", 0 - (this.height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .style("fill", "#8B8B8B")
            .text("% of Current ISD Delivered");
    }

    private getPositionXY(xScale: d3.ScaleLinear<number, number, never>, yScale: d3.ScaleLinear<number, number, never>, lineData: LineChartData[]) {
        const posX = (_, i) => xScale(i);
        const posY = (d, _) => yScale(d.value);
        return { posX, posY };
    }

    /**
     * Appends an SVG path element with specified attributes to a given chart
     * wrapper SVG group.
     * @param chartWrapperG - The `chartWrapperG` parameter is a selection representing a `<g>` (group)
     * element in an SVG chart.
     */
    private drawEmptyPath(chartWrapperG: d3.Selection<SVGGElement, unknown, HTMLElement, any>) {
        chartWrapperG
            .append("path")
            // .attr("transform", `translate(${this.chartOptions.margin.left},0)`)
            .attr("fill", "none")
            // .attr("stroke", "steelblue")
            .attr("stroke-linejoin", "round")
            .attr("stroke-linecap", "round")
            .attr("stroke-width", 1.5);
    }

    private drawArea(
        singleLineWrapperG: d3.Selection<SVGGElement, unknown, HTMLElement, any>, 
        lineData: LineChartData[], 
        xScale: d3.ScaleLinear<number, number, never>, 
        yScale: d3.ScaleLinear<number, number, never>) 
    {
        const area = d3.area<LineChartData>()
            .x((d, i) => xScale(i))
            .y0(this.height)
            .y1(d => yScale(d.value));
        singleLineWrapperG.append("path")
            .datum(lineData)
            // .attr("fill", "#B02A4C")
            // add gradient to the area
            .attr("fill", "url(#area-gradient-" + this.groupKey + ")")
            // .attr("fill-opacity", 0.1)
            .style("opacity", 0)
            .transition()
            .delay(1000)
            .duration(1000)
            // .style("opacity", Math.random() * (1 - 0.1) + 0.1) // Random value between 0.1 to 1
            .style("opacity", 1)
            .attr("d", area);
    }

    private updateChart(lineData: LineChartData[], lineIndex: number) {
        const singleLineWrapperG = d3.select(".chartWrapperG")
            .append("g")
            .attr("transform", `translate(${this.chartShiftX},0)`)
            .attr("class", `lineWrapperG-${lineIndex}`);

        this.drawEmptyPath(singleLineWrapperG);
        const { yScale, xScale } = this.getScalesXY(lineData);
        const { posX, posY } = this.getPositionXY(xScale, yScale, lineData);
        const line = this.createLine(xScale, yScale);
        // Draw an area based on the lineData
        this.drawArea(singleLineWrapperG, lineData, xScale, yScale);
        this.updatePath(line, lineData, singleLineWrapperG);
        this.drawDots(posX, posY, singleLineWrapperG, lineData);
    }

    /**
     * Adds linear gradients to SVG elements based on group data.
     */
    private addLinearGradient() {
        // Add linear gradient based on groupData length
        const defs = this.svgElem.append("defs");
        this.groupData.forEach((group, index) => {
            const linearGradient = defs.append("linearGradient")
                .attr("id", `area-gradient-${group.groupId}`)
                .attr("gradientUnits", "userSpaceOnUse")
                .attr("x1", 0).attr("y1", this.height)
                .attr("x2", 0).attr("y2", 0);
    
            linearGradient.selectAll("stop")
                .data([
                    { offset: "0%", color: "#ffffff" },
                    { offset: "100%", color: group.groupColor.areaColor }
                ])
                .enter().append("stop")
                .attr("offset", d => d.offset)
                .attr("stop-color", d => d.color);
        });
    }

    /**
     * Creates a drop shadow filter effect using SVG filters.
     */
    private dropShadowFilter() {
        const defs = this.svgElem.select("defs");
        let dropShadowFilter = defs.append('svg:filter')
        .attr('id', 'drop-shadow')
        .attr('filterUnits', "userSpaceOnUse")
        .attr('width', '250%')
        .attr('height', '250%');
        dropShadowFilter.append('svg:feGaussianBlur')
        .attr('in', 'SourceGraphic')
        .attr('stdDeviation', 2)
        .attr('result', 'blur-out');
        dropShadowFilter.append('svg:feColorMatrix')
        .attr('in', 'blur-out')
        .attr('type', 'hueRotate')
        .attr('values', 180)
        .attr('result', 'color-out');
        dropShadowFilter.append('svg:feOffset')
        .attr('in', 'color-out')
        .attr('dx', 0)
        .attr('dy', 0)
        .attr('result', 'the-shadow');
        dropShadowFilter.append('svg:feBlend')
        .attr('in', 'SourceGraphic')
        .attr('in2', 'the-shadow')
        .attr('mode', 'normal');
    }
}