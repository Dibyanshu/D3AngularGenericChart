import * as d3 from 'd3';

export type LineOptions = {
    margin: { top: number, right: number, bottom: number, left: number };
};

export type LineChartData = {
    label: string;
    value: number;
    color?: string;
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
    svgElem: d3.Selection<SVGGElement, unknown, null, undefined>;
    xScale: d3.ScaleLinear<number, number, never>;
    yScale: d3.ScaleLinear<number, number, never>;
    xAxisGenerator: d3.Axis<d3.NumberValue>;
    circle: d3.Selection<SVGCircleElement, unknown, HTMLElement, any>;
    path: d3.Selection<SVGPathElement, LineChartData[], null, undefined>;

    constructor(container: string, data: LineChartData[], options?: LineOptions) {
        this.chartOptions = { ...this.defaultOptions, ...options };
        this.container = container;
        this.data = data;
        this.render();
    }

    // draw line chart in d3
    public render() {
        // Select the container element
        const containerElement = document.querySelector(this.container);

        // Set the dimensions and margins of the chart
        this.width = containerElement.clientWidth - this.chartOptions.margin.left - this.chartOptions.margin.right;
        // this.height = containerElement.clientHeight - this.chartOptions.margin.top - this.chartOptions.margin.bottom;
        this.height = 480 - this.chartOptions.margin.top - this.chartOptions.margin.bottom;

        // Create the SVG element
        this.svgElem = d3.select(containerElement)
            .attr("width", this.width + this.chartOptions.margin.left + this.chartOptions.margin.right)
            .attr("height", this.height + this.chartOptions.margin.top + this.chartOptions.margin.bottom)
            .append("g")
            .attr("class", "chartWrapperG")
            .attr("transform", `translate(${this.chartOptions.margin.left}, ${this.chartOptions.margin.top})`);
        
        this.drawDot();
        // this.drawLine();
        this.drawAnimatedLine();

    }

    drawAnimatedLine() {
        // Add empty path
        const path = this.svgElem
        .append("path")
        // .attr("transform", `translate(${this.chartOptions.margin.left},0)`)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("stroke-width", 1.5);

        this.updateChart();
    }

    updateScales() {
        this.xScale = d3.scaleLinear()
            .domain([0, this.data.length - 1])
            .range([0, this.width]);

        this.yScale = d3.scaleLinear()
            // .domain([0, d3.max(this.data, d => d.value)]) // Auto scale enabler
            .domain([0, 100])
            .range([this.height, 0]);
        
        return { yScale: this.yScale, xScale: this.xScale };
    }

    createLine() {
        return d3.line<LineChartData>()
        .x((d, i) => this.xScale(i))
        .y(d => this.yScale(d.value));
    }

    updateAxes(chartWrapperG, xScale, yScale) {
        // Axis generator 
        this.xAxisGenerator = d3.axisBottom(xScale);
        this.xAxisGenerator.ticks(this.data.length);
        // array of labels extract from data
        this.xAxisGenerator.tickFormat((d, i) => this.data[i].label);
        // xAxisGenerator.tickSize(-this.height);
        // Add x-axis
        this.svgElem.append("g")
            .attr("transform", `translate(0, ${this.height})`)
            .call(this.xAxisGenerator);

        // Add y-axis
        this.svgElem.append("g")
            .call(d3.axisLeft(yScale));
        // chartWrapperG
        //     .select(".x-axis")
        //     .attr("transform", `translate(0,${this.height})`)
        //     .call(d3.axisBottom(xScale).ticks(this.data.length));
        // chartWrapperG
        //     .select(".y-axis")
        //     .attr("transform", `translate(0, 0)`)
        //     .call(d3.axisLeft(yScale));
    }

    updatePath(line) {
        const updatedPath = d3
        .select("path")
        .interrupt()
        .datum(this.data)
        .attr("class", "line")
        .style("stroke-width", 2)
        .style("fill", "none")
        .style("stroke", "#B02A4C")
        .attr('marker-start', 'url(#dot)')
        .attr('marker-mid', 'url(#dot)')
        .attr('marker-end', 'url(#dot)')
        .attr("d", line);

        const pathLength = (updatedPath.node() as any).getTotalLength();
        // D3 provides lots of transition options, have a play around here:
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

    addLabels() {
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

    updateChart() {
        const { yScale, xScale } = this.updateScales();
        const line = this.createLine();
        const chartWrapperG = d3.select(".chartWrapperG");
        this.updateAxes(chartWrapperG, xScale, yScale);
        this.addLabels();
        this.updatePath(line);
    }

    // draw line
    /**
     * @deprecated: This method is deprecated, use drawAnimatedLine instead
     */
    drawLine() {
        // Set the x and y scales
        this.xScale = d3.scaleLinear()
            .domain([0, this.data.length - 1])
            .range([0, this.width]);

        this.yScale = d3.scaleLinear()
            // .domain([0, d3.max(this.data, d => d.value)])
            .domain([0, 100])
            .range([this.height, 0]);

        // Define the line generator
        const line = d3.line<LineChartData>()
            .x((d, i) => this.xScale(i))
            .y(d => this.yScale(d.value));

        // Append the line path to the SVG with line styling
        this.path = this.svgElem.append("path")
            .datum(this.data)
            .attr("class", "line")
            .style("stroke-width", 2)
            .style("fill", "none")
            .style("stroke", "#B02A4C")
            .attr('marker-start', 'url(#dot)')
            .attr('marker-mid', 'url(#dot)')
            .attr('marker-end', 'url(#dot)')
            .attr("d", line);

        // Axis generator 
        this.xAxisGenerator = d3.axisBottom(this.xScale);
        this.xAxisGenerator.ticks(this.data.length - 1);
        // array of labels extract from data
        this.xAxisGenerator.tickFormat((d, i) => this.data[i].label);
        // xAxisGenerator.tickSize(-this.height);
        // Add x-axis
        this.svgElem.append("g")
            .attr("transform", `translate(0, ${this.height})`)
            .call(this.xAxisGenerator);

        // Add y-axis
        this.svgElem.append("g")
            .call(d3.axisLeft(this.yScale));

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

    // draw dots on the line chart
    drawDot() {
        // Select the first <g> element within the <svg>
        const firstG = d3.select('svg').select('g');
        // Append <defs> to the first <g>
        const defs = firstG.append('defs');
        // Append <marker> to <defs>
        const marker = defs.append('marker')
        .attr('id', 'dot')
        .attr('viewBox', [0, 0, 20, 20])
        .attr('refX', 10)
        .attr('refY', 10)
        .attr('markerWidth', 10)
        .attr('markerHeight', 10)
        this.circle = marker.append('circle')
        .attr('cx', 10)
        .attr('cy', 10)
        .attr('r', 5)
        .style("stroke", "#B02A4C")
        .style("stroke-width", "2px")
        .style('fill', 'white');
    }
}