interface CommissionRecord { id: string; status: string; commissionNumber?: string; createdAt?: string }
interface CommissionResponse { data: CommissionRecord }
interface CommissionApi {
  create: (payload: unknown) => Promise<CommissionResponse>;
  findOne: (id: string) => Promise<CommissionResponse>;
  update: (id: string, payload: unknown) => Promise<CommissionResponse>;
  submit: (id: string) => Promise<CommissionResponse>;
}

export async function submitCommission(
  api: CommissionApi, payload: unknown, draftId: string | undefined,
  rememberDraft: (id: string) => void,
): Promise<CommissionResponse> {
  let response: CommissionResponse;
  if (draftId) {
    response = await api.findOne(draftId);
    // A previous submission may have succeeded even if its response was lost.
    if (response.data.status !== 'draft') return response;
    response = await api.update(draftId, payload);
  } else {
    response = await api.create(payload);
    rememberDraft(response.data.id);
  }
  return api.submit(response.data.id);
}
