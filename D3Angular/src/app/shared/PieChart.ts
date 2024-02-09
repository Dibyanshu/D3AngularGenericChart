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
      })
      .attr("class", "arc");

    this.arcs.append("path")
      .attr("d", this.arc)
      .attr("fill", (d, i) => this.colors(i.toString()));

    this.drawLabelPointerArrow()
  }

  drawLabelPointerArrow() {
    // const textGroup = this.arcs.append("g")
    //     .each((d, i, nodes) => {
    //         if(this.chartOptions.arcScalingEnable) {
    //             console.log('d-', d)
    //             // console.log('i-', i)
    //             // console.log('nodes-', nodes)
    //             debugger
    //         }
    //     })
    //     // .attr("transform", d => `translate(${this.arc.centroid(d)})`)
    //     .attr("transform", d => {
    //         var c = this.arc.centroid(d),
    //             x = c[0],
    //             y = c[1],
    //             // pythagorean theorem for hypotenuse
    //             h = Math.sqrt(x*x + y*y);
    //         return "translate(" + (x/h * 20) +  ',' +
    //            (y/h * 20) +  ")"; 
    //     })

    this.arcs.append("text")
        .each((d, i, nodes) => {
            debugger
        })
        .attr("transform", d => {
            const c = this.arc.centroid(d);
            const x = c[0];
            const y = c[1];
            // pythagorean theorem for hypotenuse
            const h = Math.sqrt(x*x + y*y);
            return "translate(" + (x/h * 380) +  ',' +(y/h * 240) +  ")"; 
        })
        // .attr("text-anchor", (d) => {
        //     // are we past the center?
        //     return (d.endAngle + d.startAngle)/2 > Math.PI ? "end" : "start";
        // })
        .text(d => d.data);


    
    // const pointer = this.svg.append("g")
    //   .attr("transform", `translate(${this.width / 2}, ${this.height / 2})`);
    

    // pointer.append("circle")
    //   .attr("r", 5)
    //   .attr("fill", "black");

    // pointer.append("line")
    //   .attr("x1", 0)
    //   .attr("x2", 0)
    //   .attr("y1", 0)
    //   .attr("y2", -this.radius - 20)
    //   .attr("stroke", "black")
    //   .attr("stroke-width", 2);
  }
}
