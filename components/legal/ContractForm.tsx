"use client";

import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, X, Loader2 } from "lucide-react";
import { legalServicesApi } from "@/lib/legal-services";
import toast from "react-hot-toast";

interface PartyInfo {
  name: string;
  type: string;
  idType: string;
  idNumber: string;
  nationality: string;
  city: string;
  nationalAddress: string;
  phone: string;
  email: string;
}

interface AgentInfo {
  name: string;
  agencyNumber: string;
  documentId?: string;
}

interface ContractFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ContractForm({ onSuccess, onCancel }: ContractFormProps) {
  const { t } = useLanguage();
  
  const [contractType, setContractType] = useState<string>("عقد البيع");
  const [otherContractType, setOtherContractType] = useState<string>("");
  const [isReviewMode, setIsReviewMode] = useState(false);

  const [firstParty, setFirstParty] = useState<PartyInfo>({
    name: "",
    type: "فرد",
    idType: "هوية",
    idNumber: "",
    nationality: "",
    city: "",
    nationalAddress: "",
    phone: "",
    email: "",
  });

  const [hasFirstAgent, setHasFirstAgent] = useState(false);
  const [firstAgent, setFirstAgent] = useState<AgentInfo>({
    name: "",
    agencyNumber: "",
  });

  const [secondParty, setSecondParty] = useState<PartyInfo>({
    name: "",
    type: "فرد",
    idType: "هوية",
    idNumber: "",
    nationality: "",
    city: "",
    nationalAddress: "",
    phone: "",
    email: "",
  });

  const [hasSecondAgent, setHasSecondAgent] = useState(false);
  const [secondAgent, setSecondAgent] = useState<AgentInfo>({
    name: "",
    agencyNumber: "",
  });

  const [servicesDescription, setServicesDescription] = useState("");
  const [contractDuration, setContractDuration] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentDates, setPaymentDates] = useState("");
  const [rightsResponsibilities, setRightsResponsibilities] = useState("");
  const [cancellationTerms, setCancellationTerms] = useState("");
  const [applicantRole, setApplicantRole] = useState<string>("الطرف الاول");

  const [contractFiles, setContractFiles] = useState<File[]>([]);
  const [additionalFiles, setAdditionalFiles] = useState<File[]>([]);
  const [firstAgentFile, setFirstAgentFile] = useState<File | null>(null);
  const [secondAgentFile, setSecondAgentFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const contractTypes = [
    "عقد البيع",
    "عقد الإيجار",
    "عقد الانتفاع العقاري",
    "عقد الهبة العقاري",
    "عقد الرهن العقاري",
    "عقد الاستثمار العقاري",
    "مراجعة العقود",
    "اخرى"
  ];

  const partyTypes = ["فرد", "شركة"];
  const idTypes = ["هوية", "إقامة", "سجل تجاري"];
  const applicantRoles = ["الطرف الاول", "الطرف الثاني", "الوكيل"];

  // Update review mode when contract type changes
  const handleContractTypeChange = (value: string) => {
    setContractType(value);
    setIsReviewMode(value === "مراجعة العقود");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'contract' | 'additional') => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      if (type === 'contract') {
        setContractFiles(prev => [...prev, ...newFiles]);
      } else {
        setAdditionalFiles(prev => [...prev, ...newFiles]);
      }
    }
  };

  const removeFile = (index: number, type: 'contract' | 'additional') => {
    if (type === 'contract') {
      setContractFiles(prev => prev.filter((_, i) => i !== index));
    } else {
      setAdditionalFiles(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Upload documents
      let contractDocumentIds: string[] = [];
      let additionalDocumentIds: string[] = [];

      if (contractFiles.length > 0) {
        const uploadResponse = await legalServicesApi.uploadLegalDocuments(contractFiles, 'contract');
        contractDocumentIds = uploadResponse.files.map((file: any) => file.id || file.url);
      }

      if (additionalFiles.length > 0) {
        const uploadResponse = await legalServicesApi.uploadLegalDocuments(additionalFiles, 'contract');
        additionalDocumentIds = uploadResponse.files.map((file: any) => file.id || file.url);
      }

      let firstAgentDocumentId: string | undefined;
      let secondAgentDocumentId: string | undefined;

      if (hasFirstAgent && firstAgentFile) {
        const uploadResponse = await legalServicesApi.uploadLegalDocuments([firstAgentFile], 'contract', undefined, 'agency');
        firstAgentDocumentId = uploadResponse.files[0]?.id || uploadResponse.files[0]?.url;
      }

      if (hasSecondAgent && secondAgentFile) {
        const uploadResponse = await legalServicesApi.uploadLegalDocuments([secondAgentFile], 'contract', undefined, 'agency');
        secondAgentDocumentId = uploadResponse.files[0]?.id || uploadResponse.files[0]?.url;
      }

      // Prepare contract data
      const contractData: any = {
        contractType,
        otherContractType: contractType === "اخرى" ? otherContractType : undefined,
        applicantRole,
        contractDocumentIds,
        additionalDocumentIds,
      };

      // Only include party info and details if NOT in review mode
      if (!isReviewMode) {
        contractData.firstParty = firstParty;
        contractData.secondParty = secondParty;
        
        if (hasFirstAgent && firstAgent.name && firstAgent.agencyNumber) {
          contractData.firstPartyAgent = {
            ...firstAgent,
            documentId: firstAgentDocumentId,
          };
        }
        
        if (hasSecondAgent && secondAgent.name && secondAgent.agencyNumber) {
          contractData.secondPartyAgent = {
            ...secondAgent,
            documentId: secondAgentDocumentId,
          };
        }

        contractData.servicesDescription = servicesDescription;
        contractData.contractDuration = contractDuration;
        contractData.paymentDetails = {
          amount: paymentAmount,
          method: paymentMethod,
          dueDates: paymentDates,
        };
        contractData.rightsResponsibilities = rightsResponsibilities;
        contractData.cancellationTerms = cancellationTerms;
      }

      await legalServicesApi.createContract(contractData);
      
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
    label: string,
    hasAgent: boolean,
    setHasAgent: React.Dispatch<React.SetStateAction<boolean>>,
    agent: AgentInfo,
    setAgent: React.Dispatch<React.SetStateAction<AgentInfo>>,
    agentType: "first" | "second"
  ) => (
    <div className="space-y-4 p-6 bg-muted rounded-lg">
      <h3 className="text-lg font-semibold text-gray-800">{label}</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>{t('legal.contract.partyName')} *</Label>
          <Input
            value={party.name}
            onChange={(e) => setParty({ ...party, name: e.target.value })}
            placeholder={t('legal.contract.partyNamePlaceholder')}
            required
          />
        </div>

        <div>
          <Label>{t('legal.contract.partyType')} *</Label>
          <Select value={party.type} onValueChange={(val) => setParty({ ...party, type: val })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {partyTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>{t('legal.contract.idType')} *</Label>
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
          <Label>{t('legal.contract.idNumber')} *</Label>
          <Input
            value={party.idNumber}
            onChange={(e) => setParty({ ...party, idNumber: e.target.value })}
            placeholder={t('legal.contract.idNumberPlaceholder')}
            required
          />
        </div>

        <div>
          <Label>{t('legal.contract.nationality')}</Label>
          <Input
            value={party.nationality}
            onChange={(e) => setParty({ ...party, nationality: e.target.value })}
          />
        </div>

        <div>
          <Label>{t('legal.contract.city')}</Label>
          <Input
            value={party.city}
            onChange={(e) => setParty({ ...party, city: e.target.value })}
          />
        </div>

        <div>
          <Label>{t('legal.contract.nationalAddress')}</Label>
          <Input
            value={party.nationalAddress}
            onChange={(e) => setParty({ ...party, nationalAddress: e.target.value })}
          />
        </div>

        <div>
          <Label>{t('legal.contract.phone')} *</Label>
          <Input
            value={party.phone}
            onChange={(e) => setParty({ ...party, phone: e.target.value })}
            placeholder={t('legal.dispute.phonePlaceholder')}
            required
          />
        </div>

        <div className="md:col-span-2">
          <Label>{t('legal.contract.email')}</Label>
          <Input
            type="email"
            value={party.email}
            onChange={(e) => setParty({ ...party, email: e.target.value })}
          />
        </div>
      </div>

      {/* Agent Information */}
      <div className="mt-4">
        <div className="flex items-center space-x-2 mb-4">
          <Checkbox
            id={`agent-${label}`}
            checked={hasAgent}
            onCheckedChange={(checked) => setHasAgent(checked as boolean)}
          />
          <label htmlFor={`agent-${label}`} className="text-sm font-medium">
            {t('legal.contract.hasAgent')}
          </label>
        </div>

        {hasAgent && (
          <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-card rounded border">
            <div>
              <Label>{t('legal.contract.agentName')} *</Label>
              <Input
                value={agent.name}
                onChange={(e) => setAgent({ ...agent, name: e.target.value })}
                placeholder={t('legal.contract.agentNamePlaceholder')}
                required={hasAgent}
              />
            </div>

            <div>
              <Label>{t('legal.contract.agencyNumber')} *</Label>
              <Input
                value={agent.agencyNumber}
                onChange={(e) => setAgent({ ...agent, agencyNumber: e.target.value })}
                placeholder={t('legal.contract.agencyNumberPlaceholder')}
                required={hasAgent}
              />
            </div>

            <div className="md:col-span-2">
              <Label>مرفق الوكالة (صورة أو PDF)</Label>
              <Input
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  if (agentType === "first") {
                    setFirstAgentFile(file);
                  } else {
                    setSecondAgentFile(file);
                  }
                }}
              />
              {(agentType === "first" ? firstAgentFile : secondAgentFile) && (
                <p className="text-xs text-gray-600 mt-1">
                  {(agentType === "first" ? firstAgentFile : secondAgentFile)?.name}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl border border-green-100 bg-green-50 p-5">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('legal.contract.new')}</h2>
        <p className="text-gray-600 text-sm">أدخل نوع العقد والبيانات المطلوبة حسب نوع الطلب.</p>
      </div>

      {/* Contract Type */}
      <div className="space-y-4">
        <Label>{t('legal.contract.type')} *</Label>
        <Select value={contractType} onValueChange={handleContractTypeChange}>
          <SelectTrigger>
            <SelectValue placeholder={t('legal.contract.typeSelect')} />
          </SelectTrigger>
          <SelectContent>
            {contractTypes.map(type => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {contractType === "اخرى" && (
          <Input
            value={otherContractType}
            onChange={(e) => setOtherContractType(e.target.value)}
            placeholder={t('legal.contract.otherTypePlaceholder')}
            required
          />
        )}

        {isReviewMode && (
          <div className="p-4 bg-muted border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">{t('legal.contract.reviewModeDesc')}</p>
          </div>
        )}
      </div>

      {/* Show party info and details ONLY if NOT in review mode */}
      {!isReviewMode && (
        <>
          {/* First Party */}
          {renderPartyFields(
            firstParty, setFirstParty, t('legal.contract.firstParty'),
            hasFirstAgent, setHasFirstAgent, firstAgent, setFirstAgent, "first"
          )}

          {/* Second Party */}
          {renderPartyFields(
            secondParty, setSecondParty, t('legal.contract.secondParty'),
            hasSecondAgent, setHasSecondAgent, secondAgent, setSecondAgent, "second"
          )}

          {/* Contract Details */}
          <div className="space-y-4 p-6 bg-muted rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800">{t('legal.contract.details')}</h3>
            
            <div>
              <Label>{t('legal.contract.servicesDesc')}</Label>
              <Textarea
                value={servicesDescription}
                onChange={(e) => setServicesDescription(e.target.value)}
                placeholder={t('legal.contract.servicesDescPlaceholder')}
                rows={4}
              />
            </div>

            <div>
              <Label>{t('legal.contract.duration')}</Label>
              <Input
                value={contractDuration}
                onChange={(e) => setContractDuration(e.target.value)}
                placeholder={t('legal.contract.durationPlaceholder')}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label>{t('legal.contract.paymentAmount')}</Label>
                <Input
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  type="number"
                />
              </div>

              <div>
                <Label>{t('legal.contract.paymentMethod')}</Label>
                <Input
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
              </div>

              <div>
                <Label>{t('legal.contract.paymentDates')}</Label>
                <Input
                  value={paymentDates}
                  onChange={(e) => setPaymentDates(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label>{t('legal.contract.rightsResponsibilities')}</Label>
              <Textarea
                value={rightsResponsibilities}
                onChange={(e) => setRightsResponsibilities(e.target.value)}
                placeholder={t('legal.contract.rightsPlaceholder')}
                rows={4}
              />
            </div>

            <div>
              <Label>{t('legal.contract.cancellationTerms')}</Label>
              <Textarea
                value={cancellationTerms}
                onChange={(e) => setCancellationTerms(e.target.value)}
                placeholder={t('legal.contract.cancellationPlaceholder')}
                rows={4}
              />
            </div>
          </div>
        </>
      )}

      {/* Contract Upload (shown in both modes) */}
      <div className="space-y-4">
        <Label>{t('legal.contract.uploadContract')}</Label>
        <p className="text-xs text-gray-500">الصيغ المسموحة: PDF, DOC, DOCX</p>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input
            type="file"
            multiple
            accept=".pdf,.doc,.docx"
            onChange={(e) => handleFileUpload(e, 'contract')}
            className="hidden"
            id="contract-upload"
          />
          <label htmlFor="contract-upload" className="cursor-pointer">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">{t('legal.uploadFilesDesc')}</p>
          </label>
        </div>

        {contractFiles.length > 0 && (
          <div className="space-y-2">
            {contractFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                <span className="text-sm truncate">{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile(index, 'contract')}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Applicant Role */}
      <div>
        <Label>{t('legal.contract.applicantRole')} *</Label>
        <Select value={applicantRole} onValueChange={setApplicantRole}>
          <SelectTrigger>
            <SelectValue placeholder={t('legal.contract.applicantRoleSelect')} />
          </SelectTrigger>
          <SelectContent>
            {applicantRoles.map(role => (
              <SelectItem key={role} value={role}>{role}</SelectItem>
            ))}
          </SelectContent>
        </Select>
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
