"use client";

import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2 } from "lucide-react";
import { legalServicesApi } from "@/lib/legal-services";
import toast from "react-hot-toast";

interface PartyInfo {
  name: string;
  idNumber: string;
  idType: string;
}

interface DocumentationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function DocumentationForm({ onSuccess, onCancel }: DocumentationFormProps) {
  const { t } = useLanguage();
  
  const [firstParty, setFirstParty] = useState<PartyInfo>({
    name: "",
    idNumber: "",
    idType: "هوية",
  });

  const [secondParty, setSecondParty] = useState<PartyInfo>({
    name: "",
    idNumber: "",
    idType: "هوية",
  });

  const [ownershipDeedDescription, setOwnershipDeedDescription] = useState("");
  const [saleAmount, setSaleAmount] = useState("");
  const [otherDocumentsDescription, setOtherDocumentsDescription] = useState("");

  const [ownershipDeedFile, setOwnershipDeedFile] = useState<File | null>(null);
  const [saleAmountProofFile, setSaleAmountProofFile] = useState<File | null>(null);
  const [firstPartyIdFile, setFirstPartyIdFile] = useState<File | null>(null);
  const [secondPartyIdFile, setSecondPartyIdFile] = useState<File | null>(null);
  const [otherFiles, setOtherFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const idTypes = ["هوية", "إقامة", "سجل تجاري"];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'deed' | 'proof' | 'other' | 'firstId' | 'secondId') => {
    const files = e.target.files;
    if (!files) return;

    if (type === 'deed') {
      setOwnershipDeedFile(files[0]);
    } else if (type === 'proof') {
      setSaleAmountProofFile(files[0]);
    } else if (type === 'firstId') {
      setFirstPartyIdFile(files[0]);
    } else if (type === 'secondId') {
      setSecondPartyIdFile(files[0]);
    } else {
      const newFiles = Array.from(files);
      setOtherFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (type: 'deed' | 'proof' | 'other' | 'firstId' | 'secondId', index?: number) => {
    if (type === 'deed') {
      setOwnershipDeedFile(null);
    } else if (type === 'proof') {
      setSaleAmountProofFile(null);
    } else if (type === 'firstId') {
      setFirstPartyIdFile(null);
    } else if (type === 'secondId') {
      setSecondPartyIdFile(null);
    } else if (index !== undefined) {
      setOtherFiles(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (!firstParty.name || !secondParty.name) {
        toast.error(t('legal.error'));
        setIsSubmitting(false);
        return;
      }

      // Upload documents
      let ownershipDeedDocumentId: string | undefined;
      let saleAmountProofDocumentId: string | undefined;
      let firstPartyIdentityDocumentId: string | undefined;
      let secondPartyIdentityDocumentId: string | undefined;
      let otherDocumentIds: string[] = [];

      if (firstPartyIdFile) {
        const uploadResponse = await legalServicesApi.uploadLegalDocuments([firstPartyIdFile], 'documentation');
        firstPartyIdentityDocumentId = uploadResponse.files[0]?.id || uploadResponse.files[0]?.url;
      }

      if (secondPartyIdFile) {
        const uploadResponse = await legalServicesApi.uploadLegalDocuments([secondPartyIdFile], 'documentation');
        secondPartyIdentityDocumentId = uploadResponse.files[0]?.id || uploadResponse.files[0]?.url;
      }

      if (ownershipDeedFile) {
        const uploadResponse = await legalServicesApi.uploadLegalDocuments([ownershipDeedFile], 'documentation');
        ownershipDeedDocumentId = uploadResponse.files[0]?.id || uploadResponse.files[0]?.url;
      }

      if (saleAmountProofFile) {
        const uploadResponse = await legalServicesApi.uploadLegalDocuments([saleAmountProofFile], 'documentation');
        saleAmountProofDocumentId = uploadResponse.files[0]?.id || uploadResponse.files[0]?.url;
      }

      if (otherFiles.length > 0) {
        const uploadResponse = await legalServicesApi.uploadLegalDocuments(otherFiles, 'documentation');
        otherDocumentIds = uploadResponse.files.map((file: any) => file.id || file.url);
      }

      // Create documentation request
      const documentationData = {
        firstParty: { ...firstParty, identityDocumentId: firstPartyIdentityDocumentId },
        secondParty: { ...secondParty, identityDocumentId: secondPartyIdentityDocumentId },
        ownershipDeedDocumentId,
        ownershipDeedDescription,
        saleAmount: saleAmount ? parseFloat(saleAmount) : undefined,
        saleAmountProofDocumentId,
        otherDocumentIds,
        otherDocumentsDescription,
      };

      await legalServicesApi.createDocumentation(documentationData);
      
      toast.success(t('legal.success'));
      if (onSuccess) onSuccess();
      
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.response?.data?.message || error.message || t('legal.error');
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderPartyFields = (
    party: PartyInfo,
    setParty: React.Dispatch<React.SetStateAction<PartyInfo>>,
    label: string
  ) => (
    <div className="space-y-4 p-3 sm:p-6 bg-muted rounded-lg">
      <h3 className="text-lg font-semibold text-gray-800">{label}</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <Label>{t('legal.doc.name')} *</Label>
          <Input
            value={party.name}
            onChange={(e) => setParty({ ...party, name: e.target.value })}
            placeholder={t('legal.doc.namePlaceholder')}
            required
          />
        </div>

        <div>
          <Label>{t('legal.dispute.idType')} *</Label>
          <Select value={party.idType} onValueChange={(val) => setParty({ ...party, idType: val })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {idTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>{t('legal.doc.idNumber')} *</Label>
          <Input
            value={party.idNumber}
            onChange={(e) => setParty({ ...party, idNumber: e.target.value })}
            placeholder={t('legal.doc.idNumberPlaceholder')}
            required
          />
        </div>
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl border border-blue-100 bg-muted p-5">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">{t('legal.doc.new')}</h2>
        <p className="text-gray-600">{t('legal.doc.partyInfo')}</p>
      </div>

      {/* First Party */}
      {renderPartyFields(firstParty, setFirstParty, t('legal.doc.firstParty'))}
      <div>
        <Label>مرفق هوية الطرف الأول (صورة أو PDF)</Label>
        <Input
          type="file"
          accept=".pdf,image/*"
          onChange={(e) => handleFileSelect(e, 'firstId')}
        />
        {firstPartyIdFile && (
          <div className="mt-2 flex items-center justify-between p-2 bg-card rounded border">
            <span className="text-sm truncate">{firstPartyIdFile.name}</span>
            <button type="button" onClick={() => removeFile('firstId')} className="text-red-500 hover:text-red-700">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Second Party */}
      {renderPartyFields(secondParty, setSecondParty, t('legal.doc.secondParty'))}
      <div>
        <Label>مرفق هوية الطرف الثاني (صورة أو PDF)</Label>
        <Input
          type="file"
          accept=".pdf,image/*"
          onChange={(e) => handleFileSelect(e, 'secondId')}
        />
        {secondPartyIdFile && (
          <div className="mt-2 flex items-center justify-between p-2 bg-card rounded border">
            <span className="text-sm truncate">{secondPartyIdFile.name}</span>
            <button type="button" onClick={() => removeFile('secondId')} className="text-red-500 hover:text-red-700">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Ownership Deed */}
      <div className="space-y-4 p-3 sm:p-6 bg-muted rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800">{t('legal.doc.ownershipDeed')}</h3>
        <p className="text-sm text-gray-600">
          صك الملكية: الأصل المحدث والصادر من وزارة العدل، ويكون خالياً من أي موانع تمنع الإفراغ، مثل الرهن أو الحجز.
        </p>
        
        <div>
          <Label>{t('legal.doc.uploadDeed')}</Label>
          <p className="text-xs text-gray-500 mb-2">الصيغ المسموحة: PDF, صور</p>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 sm:p-6 text-center">
            <input
              type="file"
              accept=".pdf,image/*"
              onChange={(e) => handleFileSelect(e, 'deed')}
              className="hidden"
              id="deed-upload"
            />
            <label htmlFor="deed-upload" className="cursor-pointer">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">{t('legal.uploadFilesDesc')}</p>
            </label>
          </div>

          {ownershipDeedFile && (
            <div className="mt-2 flex items-center justify-between p-2 bg-card rounded border">
              <span className="text-sm truncate">{ownershipDeedFile.name}</span>
              <button
                type="button"
                onClick={() => removeFile('deed')}
                className="text-red-500 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        <div>
          <Label>{t('legal.dispute.description')}</Label>
          <Textarea
            value={ownershipDeedDescription}
            onChange={(e) => setOwnershipDeedDescription(e.target.value)}
            rows={3}
          />
        </div>
      </div>

      {/* Sale Amount */}
      <div className="space-y-4 p-3 sm:p-6 bg-muted rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800">{t('legal.doc.saleAmount')}</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>{t('legal.doc.saleAmount')}</Label>
            <Input
              type="number"
              value={saleAmount}
              onChange={(e) => setSaleAmount(e.target.value)}
              placeholder={t('legal.doc.saleAmountPlaceholder')}
            />
          </div>

          <div>
            <Label>{t('legal.doc.saleAmountProof')}</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => handleFileSelect(e, 'proof')}
                className="hidden"
                id="proof-upload"
              />
              <label htmlFor="proof-upload" className="cursor-pointer">
                <Upload className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-1 text-xs text-gray-600">{t('legal.uploadFiles')}</p>
              </label>
            </div>

            {saleAmountProofFile && (
              <div className="mt-2 flex items-center justify-between p-2 bg-card rounded border">
                <span className="text-sm truncate">{saleAmountProofFile.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile('proof')}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Other Documents */}
      <div className="space-y-4">
        <Label>{t('legal.doc.otherDocs')}</Label>
        <p className="text-xs text-gray-500">الصيغ المسموحة: PDF, DOC, DOCX, صور</p>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 sm:p-6 text-center">
          <input
            type="file"
            multiple
            accept=".pdf,.doc,.docx,image/*"
            onChange={(e) => handleFileSelect(e, 'other')}
            className="hidden"
            id="other-upload"
          />
          <label htmlFor="other-upload" className="cursor-pointer">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">{t('legal.doc.uploadOtherDocs')}</p>
          </label>
        </div>

        {otherFiles.length > 0 && (
          <div className="space-y-2">
            {otherFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                <span className="text-sm truncate">{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile('other', index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div>
          <Label>{t('legal.dispute.description')}</Label>
          <Textarea
            value={otherDocumentsDescription}
            onChange={(e) => setOtherDocumentsDescription(e.target.value)}
            rows={3}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4 justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            {t('legal.cancel')}
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('legal.submitting')}
            </>
          ) : (
            t('legal.submit')
          )}
        </Button>
      </div>
    </form>
  );
}
