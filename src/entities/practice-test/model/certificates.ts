"use client";

import { useCallback, useEffect, useState } from "react";

import { api } from "@/shared/api";
import { createStorageStore } from "@/shared/lib/react";

/** Server bergan (tekshiriladigan) sertifikat */
export interface OfficialCertificate {
  code: string;
  eventId: string;
  name: string;
  correct: number;
  total: number;
  scores: { rw?: number; math?: number };
  issuedAt: string;
}

let officialCache: OfficialCertificate[] | null = null;

/** Serverdagi sertifikatlarim; `null` — hali yuklanmagan (yoki kirilmagan) */
export function useOfficialCertificates(enabled: boolean) {
  const [list, setList] = useState(officialCache);
  const reload = useCallback(() => {
    api<{ certificates: OfficialCertificate[] }>("/api/certificates", { cache: "no-store" })
      .then((d) => {
        officialCache = d.certificates;
        setList(d.certificates);
      })
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (enabled) reload();
  }, [enabled, reload]);
  return { list, reload };
}

/** Qurilmadagi nusxa: server rasmiysini bergunicha darhol ko'rsatish uchun (id — urinish id'si bilan bir xil). */
export interface Certificate {
  id: string;
  name: string;
  accuracy: number;
  correct: number;
  total: number;
  scores: { rw?: number; math?: number };
  issuedAt: string;
}

const store = createStorageStore<Certificate[]>("scorely.certificates.v1", []);

export const certificatesRepository = {
  list: store.get,
  issue(cert: Certificate) {
    store.set([cert, ...store.get().filter((c) => c.id !== cert.id)]);
    return cert;
  },
};

/** `undefined` — yuklanmoqda; eng yangisi boshida */
export function useCertificates() {
  return store.useValue();
}
