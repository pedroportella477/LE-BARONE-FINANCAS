'use client';

import { AttachmentParserForm } from '@/components/attachment-parser/attachment-parser-form';

export default function AttachmentParserPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-primary">Ferramenta de Análise de Anexos</h1>
        <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
          Utilize nossa inteligência artificial para extrair informações de boletos e comprovantes de forma rápida e fácil.
        </p>
      </div>
      <AttachmentParserForm />
    </div>
  );
}
