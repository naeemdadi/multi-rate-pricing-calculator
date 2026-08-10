import { notFound } from "next/navigation";

import { DocumentEditor } from "@/components/document-editor";
import { requireAuthenticatedUser } from "@/lib/auth-pages";
import { ApiError } from "@/lib/api/errors";
import { getDocument } from "@/lib/documents/service";

type DocumentPageProps = {
  params: Promise<{
    documentId: string;
  }>;
};

export default async function DocumentPage({ params }: DocumentPageProps) {
  const user = await requireAuthenticatedUser();
  const { documentId } = await params;

  try {
    const document = await getDocument(user.id, documentId);
    return <DocumentEditor initialDocument={document} />;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }

    throw error;
  }
}
