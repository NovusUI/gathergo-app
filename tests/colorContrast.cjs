const rgba = color => {
  if (color === 'transparent') return [0, 0, 0, 0];
  if (color.startsWith('#')) {
    let value = color.slice(1);
    if (value.length <= 4) value = [...value].map(part => part + part).join('');
    return [0, 2, 4].map(index => parseInt(value.slice(index, index + 2), 16)).concat(value.length === 8 ? parseInt(value.slice(6), 16) / 255 : 1);
  }
  const values = color.match(/[\d.]+/g).map(Number);
  return values.length === 3 ? [...values, 1] : values;
};
const composite = (color, background) => {
  const front = rgba(color), back = rgba(background);
  return '#' + front.slice(0, 3).map((value, index) => Math.round(value * front[3] + back[index] * (1 - front[3])).toString(16).padStart(2, '0')).join('');
};
function luminance(color) {
  const values = rgba(color).slice(0, 3).map(value => value / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
  return values[0] * .2126 + values[1] * .7152 + values[2] * .0722;
}
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((a, b) => b - a);
  return (hi + .05) / (lo + .05);
};
module.exports = { contrast, composite };
