import * as d3 from 'd3';

export type LineOptions = {
    margin: { top: number, right: number, bottom: number, left: number };
    maxHeight?: number;
    isVHetchingLine?: boolean;
    isTargetLine?: boolean;
    targetData?: {
        value: number;
        color: string;
    };
    isAutoScale?: boolean;
    groupDataHighestId?: string;
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
    isComparison: boolean; // identifier to plot bold style hetching lines
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
        maxHeight: 560,
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
    private coldRedraw: boolean; // to enable redraw of chart while resize
    private dotLabelConvergenceRandomize = true;
    dataRotationThresold: number = 10;
    isDataSwaping: boolean = false;

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
        if(isInterim){ // not in use have to re-itirate
            this.updateSVGElem();
            this.coldRedraw = false;
            this.drawChartLines();
            this.addHetchingLines();
            return;
        }
        // Remove existing chart if it exists
        if (document.querySelector(`${this.container} > .chartWrapperG`)) {
            d3.select(`${this.container} > .chartWrapperG`).remove();
        }
        
        this.updateSVGElem();
        
        this.addLinearGradient();
        this.dropShadowFilter();
        
        this.drawChartLines();
        // Add grid lines
        this.addHetchingLines();
    }

    /**
     * The function `updateSVGElem` updates the SVG element based on container dimensions and chart
     * options, adjusting width & height based on it's immediate containetr.
     * It can be called when the chart is resized or when the chart is first rendered.
     */
    private updateSVGElem() {
        // Select the container element
        const containerElement = document.querySelector(this.container);
        const containerElemParent = document.querySelector(this.container).parentElement;
        // Set the dimensions and margins of the chart
        this.width = containerElemParent.clientWidth - this.chartOptions.margin.left - this.chartOptions.margin.right;
        this.height = containerElemParent.clientHeight - this.chartOptions.margin.top - this.chartOptions.margin.bottom;
        // update the SVG element
        const svgWidth = this.width + this.chartOptions.margin.left + this.chartOptions.margin.right + this.chartShiftX + this.chartOptions.margin.left * 2; // to add the y-axis labels
        let svgHeight = this.height + this.chartOptions.margin.top + this.chartOptions.margin.bottom + 60;

        // reset height if maxHeight is defined
        if (this.chartOptions.maxHeight && svgHeight > this.chartOptions.maxHeight) {
            this.height = this.chartOptions.maxHeight - this.chartOptions.margin.top - this.chartOptions.margin.bottom;
            svgHeight = this.chartOptions.maxHeight + this.chartOptions.margin.top + this.chartOptions.margin.bottom + 60;
        }
        // select .chartWrapperG and remove if already exists
        if (d3.select(".chartWrapperG").node()) {
            d3.select(".chartWrapperG").remove();
        }
        // Append the SVG element to the container element
        this.svgElem = d3.select(containerElement)
            .attr("width", containerElemParent.clientWidth - this.chartOptions.margin.left - this.chartOptions.margin.right)
            .attr("height", svgHeight)
            .attr("viewBox", `0 0 ${svgWidth} ${svgHeight}`)
            .append("g")
            .attr("class", "chartWrapperG")
            .attr("transform", `translate(${this.chartOptions.margin.left + this.chartShiftX}, ${this.chartOptions.margin.top})`);
    }

    /**
     * Resizes the chart to fit the container element.
     */
    public resize() {
        this.updateSVGElem();
        this.coldRedraw = true;
        // Update the scales and redraw the chart
        this.drawChartLines();
        this.addHetchingLines();
        // adjust the dot labels x and y position if any of the value converges
        if(this.dotLabelConvergenceRandomize){
            this.adjustDotLabelPosition();
        }
    }

    private drawChartLines() {
        /*
        * @Limitation: due to the multiple area fill gradient, 
        * we need to draw the higher x-axis value area first and then the lower x-axis value area
        * to avoid the overlapping of the area fill gradient 
        */
        if(this.isDataSwaping){
            this.groupData = this.groupData.sort((a, b) => {
                return d3.max(a.data, d => d.value) - d3.max(b.data, d => d.value);
            });
        }
        // Draw an area based on the lineData
        this.drawAreas(this.groupData);
        // Draw the lines for each group
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
        // draw the goal single line and associated dots
        if(this.chartOptions.isTargetLine && this.chartOptions.targetData){
            this.drawGoalSection();
        }
        // adjust the dot labels x and y position if any of the value converges
        if(this.dotLabelConvergenceRandomize){
            this.adjustDotLabelPosition();
        } 
    }

    /**
     * The `drawGoalSection` function in TypeScript creates a goal line chart with data points and
     * animations.
     */
    drawGoalSection() {
        // build goal data as LineChartData
        if(d3.select(".lineWrapperG-target").node()){
            d3.select(".lineWrapperG-target").remove();
        }
        const goalData: LineChartData[] = [
            { labelBottom: 'Goal', value: 98, isComparison: false },
            { labelBottom: 'Goal', value: 98, isComparison: false }
        ];
        let singleLineWrapperG = d3.select(".chartWrapperG")
        const { yScale, xScale } = this.getScalesXY(goalData);
        const { posX, posY } = this.getPositionXY(xScale, yScale, goalData);
        const goalLine = this.createLine(xScale, yScale);
        const gutterVal = 11;
        /*
        * Line drawing
        */
        const goalPath = singleLineWrapperG.append("g")
            .attr("class", `lineWrapperG-target`)
            .append("path")
            .attr("class", "goal-line")
            .style("stroke-width", 2)
            .attr("transform", `translate(${this.chartOptions.margin.left + gutterVal},0)`)
            .attr("stroke-linejoin", "round")
            .attr("stroke-linecap", "round");

        const updatedPath = d3
            .select(goalPath.node())
            // .select("path")
            .interrupt()
            .datum(goalData)
            .style("stroke-width", 2)
            .style("fill", "none")
            .style("stroke", this.chartOptions.targetData.color)
            .attr("d", goalLine);

        const pathLength = (updatedPath.node() as any).getTotalLength();
        const transitionPath = d3
            .transition()
            .ease(d3.easeSin)
            .duration(2500);
        updatedPath
            .attr("stroke-dashoffset", pathLength)
            .attr("stroke-dasharray", pathLength)
            .transition(transitionPath)
            .attr("stroke-dashoffset", 0);
        /*
        * Dot drawing
        */
        d3.select('.lineWrapperG-target')
            .selectAll('circle.dots')
            .data(goalData)
            .enter().append('circle')
            .attr("cx", posX) // minus it's width
            .attr("cy", posY)
            .attr('r', 6)
            .attr("transform", `translate(${this.chartOptions.margin.left + gutterVal},0)`) // temp fix
            .style("stroke", this.chartOptions.targetData.color)
            .style("stroke-width", "2px")
            .style('fill', 'white')
            .style("filter", "url(#drop-shadow)")
            .attr("class", "dots");
        // gets all the dots and do a for loop to get its data and append text
        const that = this;
        d3.select('.lineWrapperG-target').selectAll("circle.dots").each(function(d, i){
            let _posY = posY(d, i) + 4;
            let _posX = posX(d, i);
            const lastIndexNumber = goalData.length - 1;
            if(i === lastIndexNumber){
                _posX += 22;
            }
            else{
                _posX -= 22;
            }
            // if((d as any).value > 96){
            //     _posY += 20;
            // }
            // else{
            //     _posY -= 10;
            // }
            d3.select((this as any).parentElement).append("text")
                .text((d as any).value + "%")
                .attr("x", _posX)
                .attr("transform", `translate(${that.chartOptions.margin.left + gutterVal},0)`) // temp fix
                .attr("y", _posY)
                .style("text-anchor", "middle")
                .style("font-size", "10px")
                .style("fill", that.groupColor.dotColor);
        });
        
        /*
        singleLineWrapperG.selectAll("circle.dots")
            .style("opacity", 0)
            .transition()
            .delay(function(d,i){ return i * (2500/goalData.length); })
            .ease(d3.easeLinear)
            .duration(2500)
            .style("opacity", 1);
        */
    }

    private drawLegends(xScale: d3.ScaleLinear<number, number, never>, yScale: d3.ScaleLinear<number, number, never>, legendData: { label: string; color: string; }[]) {
        // Add circular legends below x-axis
        if (this.svgElem.select(".legendWrapper").node() && this.coldRedraw) {
            this.svgElem.select(".legendWrapper").remove();
        }
        const legendWrapper = this.svgElem.append("g")
            .attr("class", "legendWrapper");
            const spaceBetweenLegends = 140;
            let transformValue = `translate(${this.chartOptions.margin.left}, 0)`;
            legendData.forEach((legend, index) => {
                if(index === 1){
                    transformValue = `translate(${this.chartOptions.margin.left + 25}, 0)`; // temp fix
                }
                const legendDataGrp = legendWrapper.append("g")
                    .attr("class", `legend-group-${legend.label}`)
                    // if index is 1 then add the gutter value to the x position
                    .attr("transform", `${transformValue}`);
                legendDataGrp.append("circle")
                    .attr("cx", index * spaceBetweenLegends)
                    .attr("cy", 0)
                    .attr("r", 6)
                    .style("stroke", legend.color)
                    .style("stroke-width", "2px")
                    .style('fill', 'white')
                    .style("filter", "url(#drop-shadow)")
                legendDataGrp.append("text")
                    .attr("x", index * spaceBetweenLegends + 16)
                    .attr("y", 5)
                    .text(legend.label)
                    .style("font-size", "12")
                    .style("fill", "#000000");
        });
        // center align the legendWrapper group
        const bbox = legendWrapper.node().getBBox();
        legendWrapper.attr("transform", `translate(${this.width / 2 - bbox.width / 2}, ${this.height + this.chartOptions.margin.top + 45})`);
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
        // gets all the dots and do a for loop to get its data and append text according to X Y position of the dots
        const that = this;
        chartWrapperG.selectAll("circle.dots").each(function(d, i){
            let _posY = posY(d, i);
            // for given {this.chartOptions.groupDataHighestId} line group the dot label should be below the dot
            if(that.groupKey === that.chartOptions.groupDataHighestId){
                _posY += 21;
            } 
            // // {10} is the gutter value to maintain the asthetic of the dots
            // if(d.value > that.chartOptions.targetData?.value - 10){ 
            //     _posY += 20;
            // }
            else{
                _posY -= 16;
            }
            d3.select((this as any).parentElement).append("text")
                .text((d as any).value + "%")
                .attr("x", posX(d, i))
                .attr("y", _posY)
                .style("font-size", "10px")
                .style("text-anchor", "middle")
                .attr("class", `dot-label-${i}`)
                .style("fill", that.groupColor.dotColor);
        });
        
        chartWrapperG.selectAll("circle.dots", "text")
            .style("opacity", 0)
            .transition()
            .delay(function(d,i){ return i * (2500/lineData.length); })
            .ease(d3.easeLinear)
            .duration(2500)
            .style("opacity", 1);
    }

    private drawAxes(xScale, yScale, lineData: LineChartData[]) {
        // check if the axis is already present
        if (this.svgElem.select(".x-axis").node() && !this.coldRedraw) {
            return;
        }
        // remove both axes
        this.svgElem.select(".x-axis").remove();
        this.svgElem.select(".y-axis").remove();
        
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
            .style("font-size", "12")
            .attr("color", "#000000")
            .attr("transform", `translate(0, ${this.height})`)
            .call(xAxisGen);

        // select all tick class inside x-axis and get data from the tick and append text
        //  rotate based on the data length {hardcoded value 15}
        const textRotation = lineData.length > this.dataRotationThresold ? -45 : 0;
        const translateXVal = lineData.length > this.dataRotationThresold ? 35 : 0;
        const translateYVal = lineData.length > this.dataRotationThresold ? this.height + 20 : this.height;
        this.svgElem.select('.x-axis').selectAll(".tick").append("text").data(lineData)
            .text(d => d.labelTop)
            .style("fill", "black")
            .style("font-size", "12")
            .attr("y", -25)
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
            .attr("transform", `translate(0, -${this.chartShiftX})`)
            .style("stroke-width", 2)
            .style("stroke", "#ddd");
        
        this.addLabels();
    }

    /**
     * The function adds dashed horizontal lines to the x-axis ticks in an SVG element.
     */
    private addHetchingLines() {
        this.svgElem.selectAll(".x-axis .tick line")
            .attr("y1", -this.height - 18)
            .style("stroke-width", 1)
            .style("stroke-dasharray", "5,5")
            .style("stroke", "#D8D8D8");
    }

    private updatePath(line, lineData: LineChartData[], chartWrapperG: d3.Selection<d3.BaseType, unknown, HTMLElement, any>) {
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
        d3.select(".y-axis").append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - this.chartOptions.margin.left*2)
            .attr("x", 0 - (this.height / 2))
            .attr("dy", "1em")
            .attr("class", "y-axis-label")
            .style("text-anchor", "middle")
            .style("fill", "#8B8B8B")
            .style("font-size", "12")
            .text("% of Ontime Shipments");
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

    private drawAreas(lineGroupData: LineChartGroupData[]){
        // change the oreder of the lineGroupData based on the groupDataHighestId
        // specific logic to handle area overlap issue
        lineGroupData = lineGroupData.sort((a, b) => {
            return a.groupId === this.chartOptions.groupDataHighestId ? 1 : -1;
        });

        lineGroupData.forEach(lineData => {
            const { yScale, xScale } = this.getScalesXY(lineData.data);
            const area = d3.area<LineChartData>()
                .x((d, i) => xScale(i))
                .y0(this.height)
                .y1(d => yScale(d.value));

            let areaWrapperGroup;
            if(d3.select(".areaWrapperG").node()){
                areaWrapperGroup = d3.select(".areaWrapperG");
            }
            else{
                areaWrapperGroup = d3.select(".chartWrapperG")
                    .append("g")
                    .attr("class", "areaWrapperG")
                    .attr("transform", `translate(${this.chartShiftX},0)`);
            }
            areaWrapperGroup.insert("path")
                .datum(lineData.data)
                // .attr("fill", lineData.groupColor.lineColor)
                .attr("class", `${lineData.groupId}`)
                .attr("fill", "url(#area-gradient-" + lineData.groupId + ")")
                .style("opacity", 0)
                .transition()
                .delay(1000)
                .duration(1000)
                .style("opacity", 1)
                .attr("d", area);
        });
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
        this.updatePath(line, lineData, singleLineWrapperG);
        this.drawDots(posX, posY, singleLineWrapperG, lineData);
    }

    /**
     * Adds linear gradients to SVG elements based on group data.
     */
    private addLinearGradient() {
        // Add linear gradient based on groupData length
        const defs = d3.select(`${this.container}`).append("defs");
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
        // improvement: check if defs already exists
        const defs = d3.select(`${this.container}`).select("defs");
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

    adjustDotLabelPosition() {
        // loop within groupData and check if the value is same then adjust the position
        const that = this;
        let lineData = [];
        this.groupData.forEach((group, index) => lineData[index] = group.data.map((d, i) => d.value))
        const matchedIndex = [];
        lineData[0].forEach((value, index) => { Math.abs(value - lineData[1][index]) < 10 ? matchedIndex.push(index) : null;});
        console.log('::matchedIndex::',matchedIndex);
        const gutterVal = 30;
        let indWisePOSxy = [];
        this.groupData.forEach((group, ind) => {
            const lineData = group.data;
            const { yScale, xScale } = this.getScalesXY(lineData);
            const { posX, posY } = this.getPositionXY(xScale, yScale, lineData);
            const dots = d3.select(`.lineWrapperG-${ind}`).selectAll("circle.dots");
            dots.each(function(d, i){
                let _posY = posY(d, i);
                let _posX = posX(d, i);
                if(matchedIndex.includes(i)){
                    d3.select((this as any).parentElement).select(`.dot-label-${i}`)
                        .attr("class", `${group.groupId}`);
                    indWisePOSxy.push({x: _posX, y: _posY});
                }
            });
        });
        // @todo: adjust the dot label position based on the matchedIndex: Incomplete
        this.groupData.forEach((group, ind) => {
            if(ind === 0){
                d3.select(`.lineWrapperG-${ind}`).selectAll(`text.${group.groupId}`).each(function(d, i){
                    d3.select(this).attr("y", indWisePOSxy[i].y - gutterVal);
                });
            }
            else{
                d3.select(`.lineWrapperG-${ind}`).selectAll(`text.${group.groupId}`).each(function(d, i){
                    d3.select(this).attr("y", indWisePOSxy[i].y + gutterVal);
                });
            }
        });
    }
}