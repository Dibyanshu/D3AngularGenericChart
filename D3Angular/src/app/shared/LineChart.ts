import * as d3 from 'd3';

export type LineOptions = {
    margin: { top: number, right: number, bottom: number, left: number };
    isVHetchingLine?: boolean;
    isTargetLine?: boolean;
    targetData?: {
        targetValue: number;
        targetColor: string;
    };
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
    groupColor: ChartColors;
    data: LineChartData[];
};

type ChartColors = {
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
        margin: { top: 20, right: 20, bottom: 30, left: 50 }
    };
    private chartOptions: LineOptions;
    private height: number;
    private width: number;
    private svgElem: d3.Selection<SVGGElement, unknown, null, undefined>;
    private chartShiftX: number = 20;
    private groupColor: ChartColors = {
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

        // Set the dimensions and margins of the chart
        this.width = containerElement.clientWidth - this.chartOptions.margin.left - this.chartOptions.margin.right;
        this.height = 480 - this.chartOptions.margin.top - this.chartOptions.margin.bottom;

        // Remove existing chart if it exists
        if(isInterim){
            this.drawLines();
            return;
        }
        if (document.querySelector(`${this.container} > .chartWrapperG`)) {
            d3.select(`${this.container} > .chartWrapperG`).remove();
        }
        
        // Create the SVG element
        this.svgElem = d3.select(containerElement)
            .attr("width", this.width + this.chartOptions.margin.left + this.chartOptions.margin.right)
            .attr("height", this.height + this.chartOptions.margin.top + this.chartOptions.margin.bottom)
            .append("g")
            .attr("class", "chartWrapperG")
            .attr("transform", `translate(${this.chartOptions.margin.left}, ${this.chartOptions.margin.top})`);
        
        this.addLinearGradient();
        this.dropShadowFilter();
        this.addLabels();
        
        this.drawLines();
        // Add grid lines
        this.addHetchingLines();
    }

    private drawLines() {
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

    private drawDots(posX: any, posY: any, dotSize: any, chartWrapperG: any, lineData: LineChartData[]) {
        chartWrapperG.append("g")
            .attr("class", "dotsWrapper")
            .selectAll('circle.dots')
            .data(lineData)
            .enter().append('circle')
            .attr("class", "dots")
            .attr("cx", posX)
            .attr("cy", posY)
            .attr("r", dotSize)
            .attr('r', 6)
            .style("stroke", this.groupColor.dotColor)
            .style("stroke-width", "2px")
            .style('fill', 'white')
            .style("filter", "url(#drop-shadow)")
            .attr("class", "dots");
        chartWrapperG.selectAll("circle.dots")
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

        const xAxisGen = d3.axisBottom(xScale);
        // while generating the ticks, we need to shift the ticks
        xAxisGen.ticks(lineData.length);
        xAxisGen.tickSize(0);
        xAxisGen.tickPadding(10);
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
        // get the translate value from the tick and set the text position
        const thisRef = this;
        this.svgElem.select('.x-axis').selectAll(".tick").append("text").data(lineData)
            .text(d => d.labelTop)
            .attr("dy", "1.5em").attr("dx", "-1em")
            // get the translate value from the tick and set the text position
            // .attr("transform", function(d, i) {
            //     const tickAsParent = d3.select((this.parentNode as any));
            //     const tick = d3.select((tickAsParent as any)).node();
            //     const xTranslate = tick.attr("transform").split("(")[1].split(",")[0];
            //     return "translate(" + xTranslate + ", "+ -thisRef.height +")";
            // })
            // .attr("transform", "rotate(-45)" + "translate("+  + ", 0)"); // check this line
        // this.svgElem.select('.x-axis').selectAll(".tick").append("text")
        //     .attr("dy", "1.5em").attr("dx", "-1em").attr("transform", "rotate(-45)")
        //     .text(d => d);

        const yAxisGen = d3.axisLeft(yScale);
        yAxisGen.tickValues([0, 20, 40, 60, 80, 100]);
        // yAxisGen fontSize
        yAxisGen.tickFormat(d => `${d}%`);
        yAxisGen.tickPadding(10);
        
        yAxisGen.tickSize(0);

        this.svgElem.append("g")
            .attr("class", "y-axis")
            .style("font-size", "14")
            .attr("color", "#000000")
            .call(yAxisGen);
        
        // select all axis and cjange color
        this.svgElem.select('.x-axis').selectAll("path").style("stroke", "#ddd").style("stroke-width", "2px");
        this.svgElem.select('.y-axis').selectAll("path").style("stroke", "#ddd").style("stroke-width", "2px");
    }

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

    private addLabels() {
        // Add labels
        // Create circular legend

        // this.svgElem.append("text")
        //     .attr("transform", `translate(${this.width / 2}, ${this.height + this.chartOptions.margin.top + 10})`)
        //     .style("text-anchor", "middle")
        //     .text("X-axis Label");

        this.svgElem.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - this.chartOptions.margin.left*2)
            .attr("x", 0 - (this.height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("% of Current ISD Delivered");
    }

    private getPositionXY(xScale: d3.ScaleLinear<number, number, never>, yScale: d3.ScaleLinear<number, number, never>, lineData: LineChartData[]) {
        const posX = (_, i) => (xScale(i) + (this.width + this.chartOptions.margin.left) / lineData.length / 2) - 42; // 42 hardcoded value for the dot position
        const posY = (d, _) => yScale(d.value);
        return { posX, posY };
    }

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
        this.drawDots(posX, posY, 5, singleLineWrapperG, lineData);
    }

    // add defs for the vertical gradient
    private addLinearGradient() {
        // Add linear gradient based on groupData length
        const defs = this.svgElem.append("defs");
        this.groupData.forEach((group, index) => {
            console.log('::group::',group);
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
        .attr('dx', 3)
        .attr('dy', 3)
        .attr('result', 'the-shadow');
        dropShadowFilter.append('svg:feBlend')
        .attr('in', 'SourceGraphic')
        .attr('in2', 'the-shadow')
        .attr('mode', 'normal');
    }
}