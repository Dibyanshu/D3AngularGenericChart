import * as d3 from 'd3';

export type LineOptions = {
    margin: { top: number, right: number, bottom: number, left: number };
};
export type LineChartData = {
    labelBottom: string;
    labelTop?: string;
    value: number;
    color?: string;
};
export type LineChartGroupData = {
    groupName: string;
    groupColor: string;
    isTargetLine?: boolean;
    data: LineChartData[];
};

export class LineChart {
    container: string;
    data: LineChartData[];
    defaultOptions: LineOptions = {
        margin: { top: 20, right: 20, bottom: 30, left: 50 }
    };
    chartOptions: LineOptions;
    height: number;
    width: number;
    svgElem: d3.Selection<SVGGElement, unknown, null, undefined>

    constructor(container: string, data: LineChartData[], options?: LineOptions) {
        this.chartOptions = { ...this.defaultOptions, ...options };
        this.container = container;
        this.data = data;
        this.render();
    }

    public render() {
        // Select the container element
        const containerElement = document.querySelector(this.container);

        // Set the dimensions and margins of the chart
        this.width = containerElement.clientWidth - this.chartOptions.margin.left - this.chartOptions.margin.right;
        this.height = 480 - this.chartOptions.margin.top - this.chartOptions.margin.bottom;

        // Remove existing chart if it exists
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
        
        this.addLabels();
        
        this.drawAnimatedLine();
    }

    private drawAnimatedLine() {
        this.updateChart(this.data, 0);
    }

    private getScalesXY(): { yScale: d3.ScaleLinear<number, number, never>; xScale: d3.ScaleLinear<number, number, never>; }{
        const xScale = d3.scaleLinear()
            .domain([0, this.data.length - 1])
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

    private drawDots(posX: any, posY: any, dotSize: any, chartWrapperG: any, data: any) {
        chartWrapperG.append("g")
            .attr("class", "dotsWrapper")
            .selectAll('circle.dots')
            .data(data)
            .enter().append('circle')
            .attr("class", "dots")
            .attr("cx", posX)
            .attr("cy", posY)
            .attr("r", dotSize)
            .attr('r', 5)
            .style("stroke", "#B02A4C")
            .style("stroke-width", "2px")
            .style('fill', 'white')
            .attr("class", "dots");
        chartWrapperG.selectAll("circle.dots")
            .style("opacity", 0)
            .transition()
            .delay(function(d,i){ return i * (2500/data.length); })
            .ease(d3.easeLinear) // this has to check
            .duration(2500)
            .style("opacity", 1);
    }

    private updateAxes(xScale, yScale, lineData: LineChartData[]) {
        // Axis generator 
        const xAxisGenerator = d3.axisBottom(xScale);
        xAxisGenerator.ticks(lineData.length);
        // array of labels extract from data
        xAxisGenerator.tickFormat((d, i) => lineData[i].labelBottom);
        // xAxisGenerator.tickSize(-this.height);
        // Add x-axis
        this.svgElem.append("g")
            .attr("transform", `translate(0, ${this.height})`)
            .call(xAxisGenerator);

        // Add y-axis
        this.svgElem.append("g")
            .call(d3.axisLeft(yScale));
    }

    private updatePath(line, lineData: LineChartData[]) {
        const updatedPath = d3
        .select("path")
        .interrupt()
        .datum(lineData)
        .attr("class", "line")
        .style("stroke-width", 2)
        .style("fill", "none")
        .style("stroke", "#B02A4C")
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
        this.svgElem.append("text")
            .attr("transform", `translate(${this.width / 2}, ${this.height + this.chartOptions.margin.top + 10})`)
            .style("text-anchor", "middle")
            .text("X-axis Label");

        this.svgElem.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - this.chartOptions.margin.left)
            .attr("x", 0 - (this.height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("Y-axis Label");
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

    private updateChart(lineData: LineChartData[], lineIndex: number) {
        const singleLineWrapperG = d3.select(".chartWrapperG").append("g").attr("class", `lineWrapperG-${lineIndex}`);
        this.drawEmptyPath(singleLineWrapperG);
        const { yScale, xScale } = this.getScalesXY();
        const { posX, posY } = this.getPositionXY(xScale, yScale, lineData);
        const line = this.createLine(xScale, yScale);
        this.updateAxes(xScale, yScale, lineData);
        this.updatePath(line, lineData);
        this.drawDots(posX, posY, 5, singleLineWrapperG, lineData);
    }
}