

export default function array_zip(a, b) {
   let result = [];
   let length = Math.min(a.length, b.length);
   for (let i = 0; i < length; i++) {
        result.push([a[i],b[i]]);
   }
   return result;
}
