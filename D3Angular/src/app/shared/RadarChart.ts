
import { ColorRange, RGBColorSet } from "../helper/ColorRange";
import * as d3 from 'd3';
import chroma from 'chroma-js';


/* The `RadarChartD3` class is a TypeScript class that represents a radar chart and provides methods
for rendering the chart with data. */
export class RadarChart {

    _container
    _data = null;
    axisSetData = [];
    chartData = [];
    _width = 540;
    _height = 640;
    _margins = {
        top: 20,
        right: 60,
        bottom: 60,
        left: 60
    };
    _radius = 0;
    _boundedRadius = 0;
    _boundedWidth = 0;
    _boundedHeight = 0;

    _dotRadius = 4;
    _baseAngleOffset = -0.5 * Math.PI;
    _angleOffset = 0;

    _axesLabels = new Set();
    _labelWidth = 120;

    _field = {
        axisSet: "axisSet",
        axis: "axis",
        value: "value"
    };

    _maxValue = 5;
    _baselineValue = 2.5;
    _bg = undefined;
    _curve = d3.curveCardinalClosed;
    _palette;
    private _multiAxesLineColor;
    private _isMultiAxesColorSet: boolean | undefined;
    private _emptyMsgElem: any;

    public get multiAxesLineColor() {
      return this._multiAxesLineColor;
    }
    public set multiAxesLineColor(value) {
      this._isMultiAxesColorSet = true
      this._multiAxesLineColor = value;
    }

    private _emptyMessageText : string = '';
    public get emptyMessageText() : string {
      return this._emptyMessageText;
    }
    public set emptyMessageText(v : string) {
      this._emptyMessageText = v;
    }

    _strokeDasharray = "2 2";
    _fontFamily = "system-ui";

    _axisSetAccessor
    _axisAccessor

    _valueAccessor
    _bounds: any;
    _angleScale: any;
    _radiusScale: d3.ScaleLinear<number, number> | undefined;
    _radarLine: d3.LineRadial<[number, number]> | undefined;
    maxChartDataValue: any;
    plotGeneratedList: any[] | undefined;
    dotGeneratedList: any[] = [];

    constructor(container: string) {
      this._container = d3.select(container);

      this._data = null;
      this.axisSetData = [];
      this._width = 640;
      this._height = 640;
      this._margins = {
        top: 60,
        right: 60,
        bottom: 60,
        left: 60
      };
      this._radius = 0;
      this._boundedRadius = 0;
      this._boundedWidth = 0;
      this._boundedHeight = 0;
  
      this._dotRadius = 4;
      this._baseAngleOffset = -0.5 * Math.PI;
      this._angleOffset = 0;
  
      this._axesLabels = new Set();
      this._labelWidth = 120;
  
      this._field = {
        axisSet: "axisSet",
        axis: "axis",
        value: "value"
      };
  
      this._maxValue = 5;
      this._baselineValue = 2.5;
      this._bg = undefined;
      this._curve = d3.curveCardinalClosed;
      this._palette = ({
        text: "#222",
        grid: "#d3d3d3",
        gridAccent: "#f9f9f9",
        dot: "#06a9ba",
        line: "#06a9ba",
        bg: "#f6f6f6"
      });

      this._multiAxesLineColor = [this._palette.line]
  
      this._strokeDasharray = "2 2";
      this._fontFamily = "system-ui";
  
      this._axisSetAccessor = (d) => {
        return d[this._field.axisSet];
      };

      this._axisAccessor = (d) => {
        return d[this._field.axis];
      };
  
      this._valueAccessor = (d) => {
        return Number.isNaN(d[this._field.value]) ? 0 : d[this._field.value];
      };
  
      this._getCoordinatesForAngle = this._getCoordinatesForAngle.bind(this);
      this.emptyMessageText = "Not available"
    }
  
    data(_) {
      return arguments.length ? ((this._data = _), this) : this._data;
    }
  
    field(_) {
      return arguments.length ? ((this._field = _), this) : this._field;
    }
  
    margins(_) {
      if (typeof _ === "number") {
        return (
          (this._margins = {
            top: _,
            right: _,
            bottom: _,
            left: _
          }),
          this
        );
      }
      return arguments.length ? ((this._margins = _), this) : this._margins;
    }
  
    palette(_) {
      return arguments.length ? ((this._palette = _), this) : this._palette;
    }
  
    curve(_) {
      return arguments.length ? ((this._curve = _), this) : this._curve;
    }
  
    fontFamily(_) {
      return arguments.length ? ((this._fontFamily = _), this) : this._fontFamily;
    }
  
    baselineValue(_) {
      return arguments.length
        ? ((this._baselineValue = _), this)
        : this._baselineValue;
    }
  
    angleOffset(_) {
      return arguments.length
        ? ((this._angleOffset = _), this)
        : this._angleOffset;
    }
  
    opacify = (c, a) => chroma(c).alpha(a).hex()

    _radiusFromSize(w, h) {
      return Math.floor(Math.min(w, h) / 2);
    }
  
    _updateBounds() {
      this._boundedWidth =
        this._width - (this._margins.left + this._margins.right);
      this._boundedHeight =
        this._height - (this._margins.top + this._margins.top);
  
      this._radius = this._radiusFromSize(this._width, this._height);
      this._boundedRadius =
        this._radius -
        Math.max(
          this._margins.top + this._margins.bottom,
          this._margins.left + this._margins.right
        ) /
          2;
  
      this._bounds = this._container
        .append("g")
        .style(
          "transform",
          `translate(${this._margins.left + this._boundedWidth / 2}px, ${this._boundedHeight / 2 + 55}px)`
        );
  
      // this._bounds
      //   .append("rect")
      //   .attr("width", this._boundedWidth)
      //   .attr("height", this._boundedHeight)
      //   .attr("x", -this._boundedRadius)
      //   .attr("y", -this._boundedRadius);
    }
  
    _getCoordinatesForAngle(angle: number, r = this._boundedRadius, offset = 1) {
      return [Math.cos(angle) * r * offset, Math.sin(angle) * r * offset];
    }
  
    _process() {
      this.chartData = [...this._data];
    }
  
    _init() {
        this._updateBounds();
        this.maxChartDataValue = this.findChartDataMax();

        // Scales
        // this.axisSetData = this.maxChartDataValue.axisSet[this._field.axisSet];
        this._axesLabels = this.maxChartDataValue[this._field.axisSet].map(this._axisAccessor) as any;

        const effectiveAngleOffset = this._baseAngleOffset + this._angleOffset;

        this._angleScale = d3
        .scaleBand()
        .domain(this._axesLabels as any)
        .range([effectiveAngleOffset, Math.PI * 2 + effectiveAngleOffset]);

        this._radiusScale = d3
        .scaleLinear()
        .domain([0, this.maxChartDataValue.maxValue])
        .range([0, this._boundedRadius]);

        // Curves
        this._radarLine = d3
        .lineRadial()
        .curve(this._curve)
        .radius((d) => this._radiusScale(this._valueAccessor(d)))
        .angle((d) => Math.PI / 2 + this._angleScale(this._axisAccessor(d)));
    }

    findChartDataMax(): any {
        let maxAxisObj;
        let maxAxisVal = 0;
        try{
            for (let index = 0; index < this.chartData.length; index++) {
                const axisSet = this.chartData[index];
                const currentAxisSetMaxValue = Math.max(
                    this._maxValue,
                    ...axisSet[this._field.axisSet].map(this._valueAccessor) as any
                    );
                if(maxAxisVal < currentAxisSetMaxValue){
                    maxAxisVal = currentAxisSetMaxValue
                    maxAxisObj = {...axisSet}
                    maxAxisObj['maxValue'] = maxAxisVal;
                }
            }
        }
        catch(e){
            console.warn('findChartDataMax()-', e)
        }
        return maxAxisObj;
    }
  
    _renderBg() {
      this._container
        .insert("rect", ":first-child")
        .attr("fill", this._palette.bg)
        .attr("width", this._width)
        .attr("height", this._height);
    }
  
    _renderAxis() {
      const peripherals = this._bounds.append("g").attr("class", "peripherals");

      // Add bg circles
      peripherals
        .append("circle")
        .attr("r", this._boundedRadius)
        .attr("fill", "white");
      peripherals
        .append("circle")
        .attr("r", this._boundedRadius)
        .attr("fill", this.opacify(this._palette.gridAccent, 0.075));
      peripherals
        .append("circle")
        .attr("r", this._radiusScale(this._baselineValue))
        .attr("fill", "white");
  
      // Add tick circles
      const ticks = this._radiusScale.ticks(5);
      ticks.forEach((r) => {
        if (!r) return;
  
        const tick = peripherals.append("g");
  
        tick
          .append("circle")
          .attr("class", "tick-circle")
          .attr("r", this._radiusScale(r))
          .attr("fill", "none")
          .attr("stroke", this._palette.grid)
          .attr("stroke-dasharray", this._strokeDasharray);
        const [_, max] = this._radiusScale.domain();
  
        if (r >= max) return; // Don't draw last tick label
        tick
          .append("text")
          .attr("x", 3)
          .attr("y", -this._radiusScale(r) - 4)
          .attr("class", "tick-label")
          .style("fill", this.opacify(this._palette.text, 0.5))
          .style("font-family", this._fontFamily)
          .style("font-size", "1rem")
          .text(r);
      });
      const getCoords = (d) => this._getCoordinatesForAngle(this._angleScale(d));
  
      // Add grid lines
      peripherals
        .selectAll("line")
        .data(this._axesLabels)
        .join("line")
        .attr("stroke-dasharray", this._strokeDasharray)
        .style("stroke", this._palette.grid)
        .each(function (d) {
          const [x2, y2] = getCoords(d);
          d3.select(this).attr("x2", x2).attr("y2", y2);
        });
  
      // Add Axis labels
      const labelRadiusScale = 1.1;
      const getCoordsForText = (d) =>
        this._getCoordinatesForAngle(
          this._angleScale(d),
          this._boundedRadius,
          labelRadiusScale
        );
      setTimeout(() => {
        peripherals
          .append("g")
          .attr("class", "axis-labels")
          .selectAll("text")
          .data(this._axesLabels)
          .join("text")
          .each(function (d) {
            const [x, y] = getCoordsForText(d);
            d3.select(this)
              .attr("x", x)
              .attr("y", y)
              .style(
                "text-anchor",
                Math.abs(x) < 5 ? "middle" : x > 0 ? "start" : "end"
              );
          })
          .text((d) => d)
          .style("fill", this._palette.text)
          .style("font-family", this._fontFamily)
          .style("font-size", "1rem")
          .style("dominant-baseline", "middle")
          .attr("dy", "0em");
          // .call(wrap, this._labelWidth);
      });
    }
  
    _renderPlots() {
        this.plotGeneratedList = [];
        this.dotGeneratedList = [];
        this.chartData.forEach((axisSetData, index) => {
            const plots = this._bounds.append("g");
        
            const plot = plots.append("g");
        
            // Add curve
            plot
              .append("g")
              /* If we need a single color based on color palette */
              // .attr("fill", this.opacify(this._palette.line, 0.15))
              .attr("fill", this.opacify(this._multiAxesColorLineSet(index), 0.15))
              // .attr("stroke", this._multiAxesLineColor[0])
              .attr("stroke", () => this._multiAxesColorLineSet(index))
              .attr("data-row-ind", index)
              .append("path")
              // .style("visibility", "hidden")
              // .attr("visibility", "hidden")
              .attr("d", () => this._radarLine(axisSetData[this._field.axisSet]));
        
            // Add dots
            const getCoordsForPlot = (d) =>
              this._getCoordinatesForAngle(
                this._angleScale(this._axisAccessor(d)),
                this._radiusScale(this._valueAccessor(d))
              );
            plot
              .append("g")
              // .attr("fill", this._palette.dot)
              .attr("fill", () => this._multiAxesColorLineSet(index))
              .selectAll("circle")
              .data(axisSetData[this._field.axisSet])
              .join("circle")
              .attr("r", this._dotRadius)
              .each(function (d) {
                const [cx, cy] = getCoordsForPlot(d);
                d3.select(this)
                  .attr("cx", cx)
                  .attr("cy", cy)
                  .attr("data-row-ind", index)
                  // .attr("visibility", "hidden");
              })
              .attr(
                "title",
                (d) => `${this._axisAccessor(d)}: ${this._valueAccessor(d)}`
              );
              
            this.plotGeneratedList?.push(plot.select('path'))
            this.dotGeneratedList.push(plot.selectAll('circle'))
        })
    }

    private _multiAxesColorLineSet(index: number): string {
      if(this._isMultiAxesColorSet){
        const primary: RGBColorSet = {r: 21, g: 173, b: 188};
        const green: RGBColorSet = {r: 65, g: 255, b: 82};
        const colorRange = new ColorRange(primary, green, 100);
        return '#'+colorRange.rgbToHex(this._multiAxesLineColor[index])
      }
      return this._palette.line;
    }

    highlightAxesByRowIndex(rowIndex: number){
      this.plotGeneratedList?.forEach((plot, ind) => {
        if(ind === rowIndex){
          this.resetHightlight();
          plot
            // .transition()
            // .duration(300)
            // .style('stroke-width', 4)
            .style("visibility", "visible"); 
          (this.dotGeneratedList[ind] as any).style("visibility", "visible");
        }
      })
      this._emptyMsgElem.attr("opacity", "0");
    }

    resetHightlight(){
      this.plotGeneratedList.forEach((plot, ind) => {
        plot
        // .style('stroke-width', 1)
        .style("visibility", "hidden");
        this.dotGeneratedList[ind].style("visibility", "hidden");
      })
      this._emptyMsgElem.attr("opacity", "1");
    }

    private _emptyMsgBlock() {
      this._container.call(parent => {
      this._emptyMsgElem = parent
          .append("g")
          .attr("id", "emptyMsgBlock")
          .style(
            "transform",
            `translate(${this._margins.left + this._width / 6 - 6}px, ${this._height/2 - (this._margins.bottom + 25)}px)`
          );
      
      this._emptyMsgElem.append("rect")
          .attr("width", this._width/2)
          .attr("fill", "transparent")
          .attr("height", 50);
      
      this._emptyMsgElem.append("foreignObject")
          .attr("width", this._width/2)
          .attr("height", 50)
          .append("xhtml:div")
          .attr("class", "radraChart-emptyMsg")
          // .html("The results become visible when you hover over a result in the table.")
          .html(this._emptyMessageText)
      })
    }
  
/**
 * The render function processes data, renders a background, initializes the chart, renders the axis,
 * and renders the plots.
 * @returns The `render()` method is returning the current instance of the object.
 */
    render() {
      this._process();
      this._renderBg();
      this._init();
      this._renderAxis();
      this._renderPlots();
      this._emptyMsgBlock();
    }
}