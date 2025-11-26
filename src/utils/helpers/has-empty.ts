export const hasEmpty = (values: Array<string>) => {
  return values.some(val => val == null || (typeof val === "string" && val.trim() === "") || val == undefined);
};
