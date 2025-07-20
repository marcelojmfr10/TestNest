import { sum } from "./sum.helper";

describe('sum.helper.ts', () => {
    it('should sum two numbers', () => {

        // arrange
        const num1 = 10;
        const num2 = 20;

        // act
        const result = sum(num1, num2);

        // assert
        expect(result).toBe(num1 + num2);
    })
})

