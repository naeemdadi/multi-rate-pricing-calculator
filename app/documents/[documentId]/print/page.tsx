import { notFound } from "next/navigation";

import { PrintableDocument } from "@/components/printable-document";
import { requireAuthenticatedUser } from "@/lib/auth-pages";
import { ApiError } from "@/lib/api/errors";
import { getDocument } from "@/lib/documents/service";

type PrintPageProps = {
  params: Promise<{
    documentId: string;
  }>;
};

export default async function PrintDocumentPage({ params }: PrintPageProps) {
  const user = await requireAuthenticatedUser();
  const { documentId } = await params;

  let document;
  try {
    document = await getDocument(user.id, documentId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }

    throw error;
  }

  return <PrintableDocument document={document} />;
}
