import { queryOptions, useQuery } from "@tanstack/react-query";
import { apiRequest } from "./client";
import { isValidationError } from "./errors";
import type { DemoSample, EvaluationData, MetadataData, StatusData } from "./types";

const retry = (failureCount: number, error: unknown) => !isValidationError(error) && failureCount < 1;

export const statusQuery = queryOptions({ queryKey: ["status"], queryFn: ({ signal }) => apiRequest<StatusData>("/status", {}, { signal }), retry, staleTime: 20_000, refetchOnWindowFocus: true });
export const metadataQuery = queryOptions({ queryKey: ["metadata"], queryFn: ({ signal }) => apiRequest<MetadataData>("/model/metadata", {}, { signal }), retry, staleTime: 300_000 });
export const evaluationQuery = queryOptions({ queryKey: ["evaluation"], queryFn: ({ signal }) => apiRequest<EvaluationData>("/model/evaluation", {}, { signal }), retry, staleTime: 300_000 });
export const samplesQuery = queryOptions({ queryKey: ["demo-samples"], queryFn: ({ signal }) => apiRequest<DemoSample[]>("/demo/samples", {}, { signal }), retry, staleTime: 300_000 });

export const useSystemStatus = () => useQuery(statusQuery);
export const useMetadata = () => useQuery(metadataQuery);
export const useEvaluation = () => useQuery(evaluationQuery);
