export class RadarChartFakeData {
  constructor() {
  }
/**
 * Generates random data for the radar chart.
 * 
 * @returns An array of arrays containing the generated data.
 */
  public generateData(): Array<{ axisSet: Array<{ axis: string, value: number }> }> {
    // Generate random data for the radar chart
    const data = [
      {
        axisSet:[
          {
            axis: "Axis 1",
            value: Math.random() * 100,
          },
          {
            axis: "Axis 2",
            value: Math.random() * 100,
          },
          {
            axis: "Axis 3",
            value: Math.random() * 100,
          },
          {
            axis: "Axis 4",
            value: Math.random() * 100,
          },
          {
            axis: "Axis 5",
            value: Math.random() * 100,
          },
          {
            axis: "Axis 6",
            value: Math.random() * 100,
          },
        ],
      },
      {
        axisSet:[
          {
            axis: "Axis 1",
            value: Math.random() * 100,
          },
          {
            axis: "Axis 2",
            value: Math.random() * 100,
          },
          {
            axis: "Axis 3",
            value: Math.random() * 100,
          },
          {
            axis: "Axis 4",
            value: Math.random() * 100,
          },
          {
            axis: "Axis 5",
            value: Math.random() * 100,
          },
          {
            axis: "Axis 6",
            value: Math.random() * 100,
          },
        ],
      }
    ];

    return data;
  }
}