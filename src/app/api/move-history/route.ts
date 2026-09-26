import { NextRequest } from "next/server";
import { GET as ledgerGET } from "@/app/api/ledger/route";

export async function GET(request: NextRequest) {
  return ledgerGET(request);
}
