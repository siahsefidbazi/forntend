const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

export function toFaDigits(value: number | string) {
  return String(value).replace(/\d/g, (digit) => FA_DIGITS[Number(digit)]);
}

export function toEnglishDigits(value: string) {
  return value
    .replace(/[۰-۹]/g, (digit) => String(FA_DIGITS.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)));
}

export function formatToman(value: number) {
  return `${toFaDigits(value.toLocaleString('en-US'))} تومان`;
}
