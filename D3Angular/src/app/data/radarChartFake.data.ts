export class RadarChartFakeData {
  constructor() {
  }
/**
 * Generates random data for the radar chart.
 * 
 * @returns An array of arrays containing the generated data.
 */
  public generateData(): number[][] {
    // Generate random data for the radar chart
    const data: number[][] = [];

    // Add data for each category
    for (let i = 0; i < 5; i++) {
      const categoryData: number[] = [];

      // Generate random values for each category
      for (let j = 0; j < 10; j++) {
        const value = Math.random() * 100;
        categoryData.push(value);
      }

      data.push(categoryData);
    }

    return data;
  }
}