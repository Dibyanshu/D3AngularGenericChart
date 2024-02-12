import * as d3 from 'd3';

export type PieOptions = {
    width?: number;
    height?: number;
    radius?: number;
    innerRadius?: number;
    colors?: string[];
    chartType?: 'pie' | 'donut';
    arcScalingEnable?: boolean;
    arcScalingIndex?: number;
    dataSortingEnabled?: boolean;
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
    height: 640,
    innerRadius: 0,
    radius: 320,
    width: 640,
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
      .append("svg")
      .attr("width", this.width)
      .attr("height", this.height)
      .append("g")
      .attr("transform", `translate(${this.width / 2}, ${this.height / 2}), scale(0.94)`);

    this.colors = d3.scaleOrdinal(this.chartOptions.colors);
    this.data = data;
    this.render(data.map(d => d.value));
  }


  private render(data: number[]): void {
    const pie = d3.pie<number>().value(d => d).sort(null);
    this.arc = d3.arc<d3.PieArcDatum<number>>()
      .innerRadius(this.chartOptions.chartType === 'donut' ? this.chartOptions.innerRadius : 0)
      .outerRadius(this.radius - 80);

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

    // this.drawLabelPointerArrow()
    this.drawArcForLabelXYCalculation(data)
  }

  private drawArcForLabelXYCalculation(data: number[]): void {
    const labelPie = d3.pie<number>().value(d => d).sort(null);
    const labelArc = d3.arc<d3.PieArcDatum<number>>()
      .innerRadius(0)
      .outerRadius(this.radius + 320);

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
            console.log('Side---', (d.endAngle + d.startAngle)/2 > Math.PI ? "Left" : "Right")
        })

     this.drawLabels()   
  }

  private setLabelArcProps(labelArc: d3.Arc<any, d3.PieArcDatum<number>>, d: d3.PieArcDatum<number>): object {
    return {
      x: labelArc.centroid(d)[0],
      y: labelArc.centroid(d)[1],
      side: (d.endAngle + d.startAngle) / 2 > Math.PI ? "Left" : "Right"
    };
  }

  private drawLabels() {
    // console.log('labelStartPositionMap---', this.labelStartPositionMap);
    // console.log('labelEndPositionMap---', this.labelEndPositionMap);
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
        const sideValue = this.labelEndPositionMap.get(d[0])['side'] === 'Left' ? -50 : 50;
        return this.labelEndPositionMap.get(d[0])['x'] + sideValue
      }) // Adjust the length of the horizontal line as needed
      .attr("y2", d => this.labelEndPositionMap.get(d[0])['y'])
      .attr("stroke", (d, i) => this.colors(i.toString()))
      .attr("stroke-width", 2);

      // Draw a vertical line in the middile of the above line
      
  // Draw a vertical line in the middle of the above line
  labelLinesGroup.append("line")
    .attr("x1", d => {
      const sideValue = this.labelEndPositionMap.get(d[0])['side'] === 'Left' ? -50 : 50;
      return this.labelEndPositionMap.get(d[0])['x'] + sideValue
    })
    .attr("y1", d => this.labelEndPositionMap.get(d[0])['y'] - 25)
    .attr("x2", d => {
      const sideValue = this.labelEndPositionMap.get(d[0])['side'] === 'Left' ? -50 : 50;
      return this.labelEndPositionMap.get(d[0])['x'] + sideValue
    })
    .attr("y2", d => this.labelEndPositionMap.get(d[0])['y'] + 25) // Adjust the length of the vertical line as needed
    .attr("stroke", (d, i) => this.colors(i.toString()))
    .attr("stroke-width", 2);
  }
}
