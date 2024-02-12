import * as d3 from 'd3';

export type PieOptions = {
    width?: number;
    height?: number;
    radius?: number;
    innerRadius?: number;
    radiusGutter?: number;
    pieToLabelGap?: number;
    colors?: string[];
    chartType?: 'pie' | 'donut';
    arcScalingEnable?: boolean;
    arcScalingIndex?: number;
    dataSortingEnabled?: boolean;
    seconLineWidth?: number;
    lineToTextGap?: number;
};

export type PieChartData = {
    label: string;
    value: number;
    color?: string;
};

export class PieChart {
  private svg: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
  private width: number;
  private height: number;
  private radius: number;
  private colors: d3.ScaleOrdinal<string, string>;
  private chartOptions: PieOptions;
  private chartOptionDefault: PieOptions = {
    colors: ['#e7a988', '#c9562b', '#8b3215'],
    height: 600,
    innerRadius: 0,
    radius: 200,
    radiusGutter: 80,
    pieToLabelGap: 200,
    lineToTextGap: 14,
    seconLineWidth: 30,
    width: 600,
    arcScalingEnable: false,
    arcScalingIndex: 0,
    chartType: 'pie',
    dataSortingEnabled: false
  };
  private arcs: d3.Selection<SVGGElement, d3.PieArcDatum<number>, SVGGElement, unknown>;
  private arc: d3.Arc<any, d3.PieArcDatum<number>>;
  private _data : PieChartData[];
  public get data() : PieChartData[] {
    return this._data;
  }
  public set data(v : PieChartData[]) {
    this._data = v;
  }
  private labelStartPositionMap: Map<number, object> = new Map();
  private labelEndPositionMap: Map<number, object> = new Map();

  constructor(container: string, data: PieChartData[], options?: PieOptions) {
    this.chartOptions = { ...this.chartOptionDefault, ...options };

    this.width = this.chartOptions.width;
    this.height = this.chartOptions.height;
    this.radius = this.chartOptions.radius;

    this.svg = d3.select(container)
      .attr("width", this.width)
      .attr("height", this.height)
      .append("g")
      .attr("transform", `translate(${this.width / 2}, ${this.height / 2}), scale(0.94)`);

    this.colors = d3.scaleOrdinal(this.chartOptions.colors);
    this.data = data;
    this.render()
  }

/**
 * The render function draws a pie chart, calculates the positions of the labels, and then draws the
 * labels on the chart.
 * Note: it's in a orderly manner executes all different part of the chart
 */
  public render() {
    this.drawPie(this.data.map(d => d.value));
    this.drawArcForLabelXYCalculation(this.data.map(d => d.value));
    this.drawLines();
    this.drawLabels(this.data);
  }

/**
 * The `drawPie` function in TypeScript is used to draw a pie chart with optional scaling and labeling
 * features.
 * @param {number[]} data - The `data` parameter is an array of numbers that represents the values for
 * each slice of the pie chart.
 */
  private drawPie(data: number[]): void {
    const pie = d3.pie<number>().value(d => d).sort(null);
    this.arc = d3.arc<d3.PieArcDatum<number>>()
      .innerRadius(this.chartOptions.chartType === 'donut' ? this.chartOptions.innerRadius : 0)
      /* calculate the outer radius of the pie chart based on type of the chart
      * if it's a pie chart, then the outer radius is lesser then the radius of the donut chart
      * to accomodate the upscaling of the arc
      */
      .outerRadius(this.chartOptions.chartType === 'donut' ?
        this.radius - this.chartOptions.radiusGutter : this.radius - this.chartOptions.radiusGutter/2);

    this.arcs = this.svg.selectAll("arc")
      .data(pie(data))
      .enter()
      .append("g")
      .each((d, i, nodes) => {
        if(i === this.chartOptions.arcScalingIndex && this.chartOptions.arcScalingEnable) {
          d3.select(nodes[i]).attr("transform", `scale(1.06)`);  
        }
        this.labelStartPositionMap.set(i, this.setLabelArcProps(this.arc, d))
        
      })
      .attr("class", "arc");

    this.arcs.append("path")
      .attr("d", this.arc)
      .attr("fill", (d, i) => this.colors(i.toString()));
  }

/**
 * The function `drawArcForLabelXYCalculation` is used to draw arcs for labels in a pie chart.
 * @param {number[]} data - An array of numbers representing the data for the pie chart.
 */
  private drawArcForLabelXYCalculation(data: number[]): void {
    const labelPie = d3.pie<number>().value(d => d).sort(null);
    const labelArc = d3.arc<d3.PieArcDatum<number>>()
      .innerRadius(0)
      .outerRadius(this.radius + this.chartOptions.pieToLabelGap);

    const labelArcs = this.svg.selectAll("labelArc")
      .data(labelPie(data))
      .style("visibility", "hidden")
      .enter()
      .append("g")
      .style("visibility", "hidden")
      .each((d, i, nodes) => {
        if(i === this.chartOptions.arcScalingIndex && this.chartOptions.arcScalingEnable) {
          d3.select(nodes[i]).attr("transform", `scale(1.06)`);  
        }
      })
      .attr("class", "labelArc");

    labelArcs.append("path")
      .attr("d", labelArc)
      .style("visibility", "hidden")
      .attr("fill", (d, i) => this.colors(i.toString()));
    
    labelArcs.append("g")
        .each((d, i, nodes) => {
            this.labelEndPositionMap.set(i, this.setLabelArcProps(labelArc, d))
        })
  }

/**
 * The `drawLines` draws lines on an SVG based on the
 * `labelStartPositionMap` and `labelEndPositionMap` data.
 */
  private drawLines() {
    // delete all g with class{labelArc} 
    this.svg.selectAll("g.labelArc").remove();

    // draw a g and inside that g draw a line using {this.labelStartPositionMap} and this.labelEndPositionMap
    const labelLinesGroup = this.svg.selectAll("g.labelLine")
      .data(Array.from(this.labelStartPositionMap.entries()))
      .enter()
      .append("g")
      .attr("class", "labelLine");

    labelLinesGroup.append("line")
      .attr("x1", d => d[1]['x'])
      .attr("y1", d => d[1]['y'])
      .attr("x2", d => this.labelEndPositionMap.get(d[0])['x'])
      .attr("y2", d => this.labelEndPositionMap.get(d[0])['y'])
      .attr("stroke", (d, i) => this.colors(i.toString()))
      .attr("stroke-width", 2);

    // Draw a horizontal line on labelEndPositionMap
    labelLinesGroup.append("line")
      .attr("x1", d => this.labelEndPositionMap.get(d[0])['x'])
      .attr("y1", d => this.labelEndPositionMap.get(d[0])['y'])
      .attr("x2", d => {
        const sideValue = this.labelEndPositionMap.get(d[0])['side'] === 'Left' ? 
          -this.chartOptions.seconLineWidth : this.chartOptions.seconLineWidth;
        return this.labelEndPositionMap.get(d[0])['x'] + sideValue
      }) // Adjust the length of the horizontal line as needed
      .attr("y2", d => this.labelEndPositionMap.get(d[0])['y'])
      .attr("stroke", (d, i) => this.colors(i.toString()))
      .attr("stroke-width", 2);

      // Draw a vertical line in the middile of the above line
      
  // Draw a vertical line in the middle of the above line
  labelLinesGroup.append("line")
    .attr("x1", d => {
      const sideValue = this.labelEndPositionMap.get(d[0])['side'] === 'Left' ?
        -this.chartOptions.seconLineWidth : this.chartOptions.seconLineWidth;
      return this.labelEndPositionMap.get(d[0])['x'] + sideValue
    })
    .attr("y1", d => this.labelEndPositionMap.get(d[0])['y'] - this.chartOptions.seconLineWidth/2)
    .attr("x2", d => {
      const sideValue = this.labelEndPositionMap.get(d[0])['side'] === 'Left' ?
        -this.chartOptions.seconLineWidth : this.chartOptions.seconLineWidth;
      return this.labelEndPositionMap.get(d[0])['x'] + sideValue
    })
    .attr("y2", d => this.labelEndPositionMap.get(d[0])['y'] + this.chartOptions.seconLineWidth/2) // Adjust the length of the vertical line as needed
    .attr("stroke", (d, i) => this.colors(i.toString()))
    .attr("stroke-width", 2);
  }

  private drawLabels(data: PieChartData[]): void {
    // Append a group and transform to position based on this.labelEndPositionMap, and then append text
    this.svg.selectAll("label-group")
      .data(data)
      .enter()
      .append("g")
      .attr("class", "label-group")
      .attr("transform", (d, i) => {
        const position = this.labelEndPositionMap.get(i);
        const sideValue = position['side'] === 'Left' ? -(this.chartOptions.seconLineWidth + 80) : this.chartOptions.seconLineWidth;
        const gapValue = position['side'] === 'Left' ? -this.chartOptions.lineToTextGap : this.chartOptions.lineToTextGap;
        return `translate(${position['x'] + gapValue + sideValue}, ${position['y']})`;
      })
      .append("text")
      .text(d => `${d.value}`)
      .attr("text-anchor", (d, i) => {
        const position = this.labelEndPositionMap.get(i);
        return position['side'] === 'Left' ? "left" : "right";
      })
      .attr("dy", "2px")
      .style("font-size", "24px")
      .style("fill", "black");

    this.svg.selectAll("g.label-group")
      .append("text")
      .text(d => `${d['label']}`)
      .attr("text-anchor", (d, i) => {
        const position = this.labelEndPositionMap.get(i);
        return position['side'] === 'Left' ? "left" : "right";
      })
      .attr("dy", "15px")
      .style("font-size", "14px")
      .style("fill", "gray");

    // Update with of text based on the length of the text
    // this.svg.selectAll("g.label-group text")
    //   .attr("x", (d, i, nodes) => {
    //     const position = this.labelEndPositionMap.get(i);
    //     debugger
    //     // console.log(nodes[i].clientWidth);
    //     // const sideValue = position['side'] === 'Left' ? -nodes[i].getBBox().width : 0;
    //     const sideValue = position['side'] && position['side'] === 'Left' ? -nodes[i]['clientWidth']: 0;
    //     return sideValue;
    //   });
  }
  
/**
 * The function `setLabelArcProps` calculates the x and y coordinates and determines the side (left or
 * right) for positioning labels in a pie chart.
 * @param labelArc - The `labelArc` parameter is of type `d3.Arc<any, d3.PieArcDatum<number>>`. It
 * represents the arc generator function used to create the label arcs in a pie chart.
 * @param d - The parameter `d` is of type `d3.PieArcDatum<number>`. It represents a single data point
 * in the pie chart.
 * @returns An object with properties "x", "y", and "side" is being returned.
 */
  private setLabelArcProps(labelArc: d3.Arc<any, d3.PieArcDatum<number>>, d: d3.PieArcDatum<number>): object {
    return {
      x: labelArc.centroid(d)[0],
      y: labelArc.centroid(d)[1],
      side: (d.endAngle + d.startAngle) / 2 > Math.PI ? "Left" : "Right"
    };
  }
}
