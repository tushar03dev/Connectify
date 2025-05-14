import adjs from '../assets/adjs.json';
import animals from '../assets/animals.json';

export const generateName = async(): Promise<string> => {
    const adj = adjs.adjs[Math.floor(Math.random() * adjs.adjs.length)];
    const animal = animals.animals[Math.floor(Math.random() * animals.animals.length)];
    const number = Math.floor(100 + Math.random() * 900);
    return `${adj}${animal}${number}`;
};
