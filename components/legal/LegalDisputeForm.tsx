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
  role: string;
  idType: string;
  idNumber: string;
  nationality: string;
  city: string;
  nationalAddress: string;
  phone: string;
  email: string;
}

interface LegalDisputeFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function LegalDisputeForm({ onSuccess, onCancel }: LegalDisputeFormProps) {
  const { t } = useLanguage();
  
  const [firstParty, setFirstParty] = useState<PartyInfo>({
    name: "",
    role: "بائع",
    idType: "هوية",
    idNumber: "",
    nationality: "",
    city: "",
    nationalAddress: "",
    phone: "",
    email: "",
  });

  const [secondParty, setSecondParty] = useState<PartyInfo>({
    name: "",
    role: "مشتري",
    idType: "هوية",
    idNumber: "",
    nationality: "",
    city: "",
    nationalAddress: "",
    phone: "",
    email: "",
  });

  const [disputeType, setDisputeType] = useState<string>("");
  const [otherDisputeType, setOtherDisputeType] = useState<string>("");
  const [disputeDescription, setDisputeDescription] = useState<string>("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const partyRoles = ["بائع", "مشتري", "وسيط"];
  const idTypes = ["هوية", "إقامة", "سجل تجاري"];
  const disputeTypes = [
    "نزاعات الملكية",
    "عقود البيع والإيجار",
    "قضايا الرهن العقاري",
    "مخالفات البناء",
    "نزع الملكية للمصلحة العامة",
    "مشاكل في مشاريع التطوير",
    "قضايا التركات العقارية",
    "اخرى"
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setUploadedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (!firstParty.name || !secondParty.name || !disputeDescription) {
        toast.error(t('legal.error'));
        setIsSubmitting(false);
        return;
      }

      // Upload documents first if any
      let documentIds: string[] = [];
      if (uploadedFiles.length > 0) {
        try {
          const formData = new FormData();
          uploadedFiles.forEach(file => {
            formData.append('files', file);
          });
          formData.append('serviceType', 'dispute');

          const uploadResponse = await legalServicesApi.uploadLegalDocuments(uploadedFiles, 'dispute');
          documentIds = uploadResponse.files.map((file: any) => file.id || file.url);
        } catch (uploadError) {
          console.error("Error uploading documents:", uploadError);
          toast.error(t('bm.toast.errorFileUpload'));
        }
      }

      // Create dispute
      const disputeData = {
        firstParty,
        secondParty,
        disputeType: disputeType || undefined,
        otherDisputeType: disputeType === "اخرى" ? otherDisputeType : undefined,
        disputeDescription,
        documentIds: documentIds.length > 0 ? documentIds : undefined
      };

      await legalServicesApi.createLegalDispute(disputeData);
      
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
      
      <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>{t('legal.dispute.name')} *</Label>
          <Input
            value={party.name}
            onChange={(e) => setParty({ ...party, name: e.target.value })}
            placeholder={t('legal.dispute.namePlaceholder')}
            required
          />
        </div>

        <div>
          <Label>{t('legal.dispute.role')} *</Label>
          <Select value={party.role} onValueChange={(val) => setParty({ ...party, role: val })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {partyRoles.map(role => (
                <SelectItem key={role} value={role}>{role}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          <Label>{t('legal.dispute.idNumber')} *</Label>
          <Input
            value={party.idNumber}
            onChange={(e) => setParty({ ...party, idNumber: e.target.value })}
            placeholder={t('legal.dispute.idNumberPlaceholder')}
            required
          />
        </div>

        <div>
          <Label>{t('legal.dispute.nationality')}</Label>
          <Input
            value={party.nationality}
            onChange={(e) => setParty({ ...party, nationality: e.target.value })}
            placeholder={t('legal.dispute.nationalityPlaceholder')}
          />
        </div>

        <div>
          <Label>{t('legal.dispute.city')}</Label>
          <Input
            value={party.city}
            onChange={(e) => setParty({ ...party, city: e.target.value })}
            placeholder={t('legal.dispute.cityPlaceholder')}
          />
        </div>

        <div>
          <Label>{t('legal.dispute.nationalAddress')}</Label>
          <Input
            value={party.nationalAddress}
            onChange={(e) => setParty({ ...party, nationalAddress: e.target.value })}
            placeholder={t('legal.dispute.nationalAddressPlaceholder')}
          />
        </div>

        <div>
          <Label>{t('legal.dispute.phone')} *</Label>
          <Input
            value={party.phone}
            onChange={(e) => setParty({ ...party, phone: e.target.value })}
            placeholder={t('legal.dispute.phonePlaceholder')}
            required
          />
        </div>

        <div className="md:col-span-2">
          <Label>{t('legal.dispute.email')}</Label>
          <Input
            type="email"
            value={party.email}
            onChange={(e) => setParty({ ...party, email: e.target.value })}
            placeholder={t('legal.dispute.emailPlaceholder')}
          />
        </div>
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl border border-red-100 bg-red-50 p-5">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">{t('legal.dispute.new')}</h2>
        <p className="text-gray-600">{t('legal.dispute.partyInfo')}</p>
      </div>

      {/* First Party */}
      {renderPartyFields(firstParty, setFirstParty, t('legal.dispute.firstParty'))}

      {/* Second Party */}
      {renderPartyFields(secondParty, setSecondParty, t('legal.dispute.secondParty'))}

      {/* Dispute Type */}
      <div className="space-y-4">
        <Label>{t('legal.dispute.type')} ({t('common.optional') || "اختياري"})</Label>
        <Select
          value={disputeType || "__none__"}
          onValueChange={(val) => setDisputeType(val === "__none__" ? "" : val)}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('legal.dispute.typeSelect') || "اختر نوع النزاع"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">غير محدد</SelectItem>
            {disputeTypes.map(type => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {disputeType === "اخرى" && (
          <Input
            value={otherDisputeType}
            onChange={(e) => setOtherDisputeType(e.target.value)}
            placeholder={t('legal.dispute.otherTypePlaceholder')}
            required
          />
        )}
      </div>

      {/* Dispute Description */}
      <div>
        <Label>{t('legal.dispute.description')} *</Label>
        <Textarea
          value={disputeDescription}
          onChange={(e) => setDisputeDescription(e.target.value)}
          placeholder={t('legal.dispute.descriptionPlaceholder')}
          rows={6}
          required
        />
      </div>

      {/* File Upload */}
      <div className="space-y-4">
        <Label>{t('legal.dispute.documents')}</Label>
        <p className="text-xs text-gray-500">الصيغ المسموحة: Word, PDF, صور</p>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 sm:p-6 text-center">
          <input
            type="file"
            multiple
            accept=".pdf,.doc,.docx,image/*"
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">{t('legal.uploadFilesDesc')}</p>
          </label>
        </div>

        {uploadedFiles.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">{t('legal.filesUploaded')}:</p>
            {uploadedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                <span className="text-sm truncate">{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
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
