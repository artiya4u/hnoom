// https://stackoverflow.com/questions/9461621/format-a-number-as-2-5k-if-a-thousand-or-more-otherwise-900
export function nFormatter(num, digits) {
  let si = [
    {value: 1, symbol: ''},
    {value: 1E3, symbol: 'k'},
    {value: 1E6, symbol: 'M'},
    {value: 1E9, symbol: 'G'},
    {value: 1E12, symbol: 'T'},
    {value: 1E15, symbol: 'P'},
    {value: 1E18, symbol: 'E'}
  ];
  let rx = /\.0+$|(\.[0-9]*[1-9])0+$/; // Look evil, let put it into the codebase.
  let i;
  for (i = si.length - 1; i > 0; i--) {
    if (num >= si[i].value) {
      break;
    }
  }
  return (num / si[i].value).toFixed(digits).replace(rx, '$1') + si[i].symbol;
}
