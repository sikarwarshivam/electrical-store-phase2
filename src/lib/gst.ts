const STATE_CODES: Record<string, string> = {
  "jammu and kashmir": "01",
  "himachal pradesh": "02",
  punjab: "03",
  chandigarh: "04",
  uttarakhand: "05",
  "uttaranchal": "05",
  haryana: "06",
  delhi: "07",
  rajasthan: "08",
  "uttar pradesh": "09",
  "uttar pradesh (u.p.)": "09",
  bihar: "10",
  sikkim: "11",
  "arunachal pradesh": "12",
  nagaland: "13",
  manipur: "14",
  mizoram: "15",
  tripura: "16",
  meghalaya: "17",
  assam: "18",
  "west bengal": "19",
  jharkhand: "20",
  odisha: "21",
  orissa: "21",
  chhattisgarh: "22",
  "madhya pradesh": "23",
  gujarat: "24",
  "dadra and nagar haveli and daman and diu": "26",
  "daman and diu": "25",
  maharashtra: "27",
  karnataka: "29",
  goa: "30",
  lakshadweep: "31",
  kerala: "32",
  "tamil nadu": "33",
  puducherry: "34",
  puducheri: "34",
  "andaman and nicobar islands": "35",
  "andaman and nicobar": "35",
  telangana: "36",
  "andhra pradesh": "37",
  ladakh: "38",
};

function normalizeState(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/\s+/g, " ");
}

export function getStateCode(state: string) {
  return STATE_CODES[normalizeState(state)];
}

export function splitGst(
  taxPaise: number,
  sellerStateCode: string,
  buyerStateCode?: string
) {
  const intraState =
    !!buyerStateCode &&
    sellerStateCode.trim() === buyerStateCode.trim();

  if (intraState) {
    const cgstPaise = Math.floor(taxPaise / 2);
    return {
      type: "CGST_SGST" as const,
      cgstPaise,
      sgstPaise: taxPaise - cgstPaise,
      igstPaise: 0,
    };
  }

  return {
    type: "IGST" as const,
    cgstPaise: 0,
    sgstPaise: 0,
    igstPaise: taxPaise,
  };
}
