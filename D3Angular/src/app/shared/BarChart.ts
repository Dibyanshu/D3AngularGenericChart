import * as d3 from 'd3';

export type BarChartOptions = {
    width: number;
    height: number;
};
export type BarChartData = {
    key?: string;
    values?: {
        label?: string;
        groupValueLegend?: string;
        value?: number;
        color?: string;
    }[];
};


export class BarChart {
    private chartOptions: BarChartOptions;
    private defaultOptions: BarChartOptions;
    private container: string;
    private data: BarChartData[];
    private svg: d3.Selection<d3.BaseType, unknown, HTMLElement, any>;
    private margin: { top: number; right: number; bottom: number; left: number; };
    private width: number;
    private height: number;
    private x0: d3.ScaleBand<string>;
    private x1: d3.ScaleBand<string>;
    private y: d3.ScaleLinear<number, number, never>;
    private xAxis: d3.Axis<string>;
    private yAxis: d3.Axis<d3.NumberValue>;
    private chartWrapperG: d3.Selection<SVGGElement, unknown, HTMLElement, any>;

    constructor(container: string, data: BarChartData[], barChartOptions?: BarChartOptions) {
        this.chartOptions = { ...this.defaultOptions, ...barChartOptions };
        this.container = container;
        this.data = data;
        this.init();
    }

    public init() {
        this.svg = d3.select(this.container)
            .attr("viewBox", `${this.chartOptions.width} 0 ${this.chartOptions.width} ${this.chartOptions.height}`)

        this.margin = { top: 80, right: 20, bottom: 30, left: 40 };
        this.width = this.chartOptions.width - this.margin.left - this.margin.right;
        this.height = this.chartOptions.height - this.margin.top - this.margin.bottom;

        this.drawAxes();
        this.drawBars();
        this.drawLegends();
    }

    drawAxes() {
        this.x0 = d3.scaleBand().rangeRound([0, this.width]).paddingInner(0.1);
        this.x0.domain(this.data.map(d => d.key));

        // this.x1 = d3.scaleBand();
        this.x1 = d3.scaleBand().padding(0.2).paddingOuter(1.8);
        this.y = d3.scaleLinear().rangeRound([this.height, 0]);

        this.xAxis = d3.axisBottom(this.x0).tickValues(this.data.map(d => d.key));
        this.xAxis.tickSize(0);
        this.xAxis.tickPadding(17);

        this.yAxis = d3.axisLeft(this.y);
        this.yAxis.tickSize(0);
        this.yAxis.tickFormat(d => d.toLocaleString());

        this.chartWrapperG = this.svg.append('g')
            .attr("class", "chartWrapper")
            .attr("transform", `translate(${this.chartOptions.width + this.margin.left + this.margin.right}, ${this.margin.top})`);

        const xAxisPointer = this.data.map(function (d) { return d.key; });
        const xAxisGroupPointers = this.data[0].values.map(function (d) { return d.label; });

        this.x0.domain(xAxisPointer);
        this.x1.domain(xAxisGroupPointers).rangeRound([0, this.x0.bandwidth()]);
        // this.x1.domain(xAxisPointer).rangeRoundBands([0, x0.rangeBand()]);
        this.y.domain([0, d3.max(this.data, function (key) { return d3.max(key.values, function (d) { return d.value; }); })]);

        this.chartWrapperG.append('g')
            .attr('class', 'x-axis')
            .attr('transform', 'translate(0,' + this.height + ')')
            .call(this.xAxis);

        this.chartWrapperG.append('g')
            .attr('class', 'y-axis')
            // .style('opacity','0') // animation
            .call(this.yAxis)

        // this.chartWrapperG.select('.y').transition().duration(500).delay(1000).style('opacity','1'); // animation
        this.svg.selectAll('.domain').style('stroke', '#ffffff');
        this.svg.select('.x-axis').selectAll('text')
            .style('font-size', '12px')
            .attr('fill', '#a6a6a6');
        this.svg.select('.y-axis').selectAll('text')
            .style('font-size', '12px')
            .attr('fill', '#a6a6a6');
    }

    drawBars() {
        const that = this;
        let slice = this.chartWrapperG.selectAll('.bar-slice')
            .data(this.data)
            .enter().append('g')
            .attr('class', 'bar-slice')
            .attr('transform', function (d, i) { return 'translate(' + that.x0(d.key) + ',0)'; });

        slice.selectAll('rect')
            .data(function (d) { return d.values; })
            .enter().append('rect')
            // .attr('width', this.x1.bandwidth())
            .attr('width', 15)
            .attr('rx', 8)
            // .attr('x', function(d) { return that.x1(d.label); })
            .attr('x', function (d, i) {
                return that.x1(d.label);
            })
            .style('fill', function (d) { return d.color; })
            // .attr('y', function(d) { return that.y(0); }) // animation
            .attr('y', function (d) { return that.y(d['value']); })
            // .attr('height', function(d) { return that.height - that.y(0); });
            .attr('height', function (d) { return that.height - that.y(d['value']); });
        
        // animation
        // slice.selectAll('rect')
        //     .transition()
        //     .delay(function (d) {return Math.random()*1000;})
        //     .duration(1000)
        //     .attr('y', function(d) { return that.y(d['value']); })
        //     .attr('height', function(d) { return that.height - that.y(d['value']); });
    }

    drawLegends() {
        const legendGroup = this.chartWrapperG.selectAll('.bar-slice').append('g')
            .attr('class', 'legend-group')
            .attr('transform', 'translate(0,0)');

        // Function to format numbers with commas
        const formatNumber = (num) => {
            return new Intl.NumberFormat().format(num);
        };

        legendGroup.append('rect')
            .attr('width', 90)
            .attr('height', function (d) {
                return d['values'].length * 21;
            })
            .attr('fill', '#f2f2f0')
            .style('stroke', '#adadac')
            .style('stroke-width', '0.2px')
            .attr('rx', 13)
            .attr('transform', `translate(10, -70)`);

        // Bind data to the rectangles directly
        // Append text inside each rectangle
        legendGroup.each(function (d) {
            const group = d3.select(this);
            // Append a circle and text element for each value
            d['values'].forEach((value, index) => {
                // Append a circle bullet
                group.append('circle')
                    .attr('cx', 30) // X position of the circle inside the rectangle
                    .attr('cy', -52 + index * 15) // Adjust y position to be inside the rectangle
                    .attr('r', 5) // Radius of the circle
                    .attr('fill', value.color); // Set the circle color from the data

                // Append text next to the circle with added space
                group.append('text')
                    .style('font-size', 15)
                    .style('font-weight', 500)
                    .attr('fill', "#737270")

                    // Adjust x position to fit next to the circle with space
                    /*
                    This sets the x-coordinate position of the text within the SVG. In this case, it positions the text  
                    40  units from the left edge of the SVG container. This position is adjusted to ensure that the text 
                    does not overlap with other elements, such as circles. 
                    */
                    .attr('x', 40) 
                    
                    // Adjust y position for each line
                    /*This sets the y-coordinate position of the text. The expression  -47 + index * 15 
                    calculates the vertical position based on the index of the current value being processed.  
                    
                    - The  -47  value is a base position that places the text slightly above the center of the rectangle.
                    The  index * 15  part creates vertical spacing between multiple text elements (i.e., each subsequent text
                    element is positioned  15  units lower than the previous one). This ensures that if there are multiple
                    values, they stack vertically without overlapping.  */

                    .attr('y', -47 + index * 15) 
                    .text(formatNumber(value.groupValueLegend)); // Set the text to the value
            });
        });
    }
}