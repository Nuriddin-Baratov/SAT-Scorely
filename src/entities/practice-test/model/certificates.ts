"use client";

import { createStorageStore } from "@/shared/lib/react";

/** Yakuniy test uchun berilgan sertifikat (id — urinish id'si bilan bir xil). */
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

/** Odamga qulay sertifikat raqami: SP-2026-XXXXXX */
export function certificateNumber(cert: Pick<Certificate, "id" | "issuedAt">) {
  let hash = 0;
  for (const ch of cert.id) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return `SP-${cert.issuedAt.slice(0, 4)}-${hash.toString(36).toUpperCase().padStart(6, "0").slice(-6)}`;
}
