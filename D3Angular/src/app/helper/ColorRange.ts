export interface RGBColorSet{
    r: number;
    g: number;
    b: number;
}

/* The ColorRange class generates a range of RGB colors between a start color and an end color, with a
specified number of steps. */
export class ColorRange {
    private _steps: number;
    private _startColor: RGBColorSet;
    private _endColor: RGBColorSet;
    
    constructor(startColor:RGBColorSet, endColor:RGBColorSet, steps: number) {
        this._steps = steps
        this._startColor = {...startColor}
        this._endColor = {...endColor}
    }

/**
 * The `generateColor` function takes a count as input and generates an array of RGB color sets based
 * on the start and end colors.
 * @param {number} count - The number of color sets to generate.
 * @returns an array of RGBColorSet objects.
 */
    generateColor(count: number): RGBColorSet[] {
        if(!this._startColor || !this._endColor){
            return [];
        }
        let finalColorSet: RGBColorSet [] = [];
        for (let upperIndex = 0; upperIndex < count; upperIndex++) {
            let currentSet: RGBColorSet = {
                r: 0,
                g: 0,
                b: 0
            };
            for (let index = 0; index < 3; index++) {
                let s = Object.values(this._startColor)[index];
                let e = Object.values(this._endColor)[index];
                let final = s + (((e - s) / this._steps) * this.percentage(upperIndex, count));
                currentSet.b = index === 0 ? Math.floor(final) : currentSet.b;
                currentSet.g = index === 1 ? Math.floor(final) : currentSet.g;
                currentSet.r = index === 2 ? Math.floor(final) : currentSet.r;
            }
            finalColorSet.push({...currentSet})
        }
        return finalColorSet
    }

    private percentage(partialValue: number, totalValue: number): number {
        return (100 * partialValue) / totalValue;
    }     

/**
 * The function `rgbToHex` converts an RGB color set to its corresponding hexadecimal representation.
 * @param {RGBColorSet} rgbSet - The `rgbSet` parameter is an object that represents a set of RGB color
 * values.
 * @returns a hexadecimal string representation of the RGB color set.
 */
    rgbToHex(rgbSet: RGBColorSet): string | undefined {
        if (!rgbSet) {
            return undefined;
        }
        return ((rgbSet.b | rgbSet.g << 8 | rgbSet.r << 16) / 0x1000000).toString(16).substring(2);
    }
}