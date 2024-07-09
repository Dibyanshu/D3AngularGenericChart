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
        this.height = containerElement.clientHeight - this.chartOptions.margin.top - this.chartOptions.margin.bottom;

        // Create the SVG element
        this.svgElem = d3.select(containerElement)
            .attr("width", this.width + this.chartOptions.margin.left + this.chartOptions.margin.right)
            .attr("height", this.height + this.chartOptions.margin.top + this.chartOptions.margin.bottom)
            .append("g")
            .attr("transform", `translate(${this.chartOptions.margin.left}, ${this.chartOptions.margin.top})`);
        
        this.drawLine();
        this.drawDots();
    }

    // draw line
    drawLine() {
        // Set the x and y scales
        // this.xScale = d3.scaleLinear()
        //     .domain([0, this.data.length - 1])
        //     .range([0, this.width]);
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
        this.svgElem.append("path")
            .datum(this.data)
            .attr("class", "line")
            .style("stroke-width", 2)
            .style("fill", "none")
            .style("stroke", "#ddd")
            .attr("d", line);

        // Axis generator 
        let xAxisGenerator = d3.axisBottom(this.xScale);
        xAxisGenerator.ticks(this.data.length - 1);
        // array of labels extract from data
        xAxisGenerator.tickFormat((d, i) => this.data[i].label);
        xAxisGenerator.tickSize(-this.height);
        // Add x-axis
        this.svgElem.append("g")
            .attr("transform", `translate(0, ${this.height})`)
            .call(xAxisGenerator);

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
    drawDots() {
        // select all circles and bind data and place the circle with respect to line
        // Define accessors
        const xAccessor = d => d.label; // Adjust according to your data property
        const yAccessor = d => d.value; // Adjust according to your data property

        // Bind data to circles
        const circles = this.svgElem.selectAll('circle').data(this.data);

        // Enter selection: Create new circles for new data
        circles.enter().append('circle')
        .attr('cx', d => this.xScale(xAccessor(d)))
        .attr('cy', d => this.yScale(yAccessor(d)))
        .attr('r', 5) // Adjust radius as needed
        .style('fill', 'blue'); // Adjust styling as needed

        // Update selection: Update existing circles
        circles
        .attr('cx', d => this.xScale(xAccessor(d)))
        .attr('cy', d => this.yScale(yAccessor(d)));

        // Exit selection: Remove circles without data
        circles.exit().remove();
    }
}