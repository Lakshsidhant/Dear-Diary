import dayjs from "dayjs";

export function toDDMMYYYY(d) {
  return dayjs(d).format("DD/MM/YYYY");
}
export function fullDate(d) {
  return dayjs(d).format("dddd, MMMM D, YYYY");
}
export function monthLabel(d) {
  return dayjs(d).format("MMMM YYYY");
}
export function monthYear(d) {
  return { month: dayjs(d).format("MM"), year: dayjs(d).format("YYYY") };
}
export function monthKey(d) {
  return dayjs(d).format("YYYY-MM");
}
