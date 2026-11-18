import { NextResponse } from 'next/server';
import { z } from 'zod';
import { errorResponse } from '@/lib/http';
import { fillDeploymentFormInChrome } from '@/lib/release-deployment/browser';
import {
  DEPLOYMENT_FORM_URL,
  buildFormAnswers,
  missingRequiredFields,
} from '@/lib/release-deployment/form';

export const dynamic = 'force-dynamic';

const Body = z.object({
  input: z.object({
    judul: z.string(),
    tiket: z.string(),
    squad: z.string(),
    environment: z.string(),
    picDeveloper: z.string(),
    picQa: z.array(z.string()),
    picHoe: z.string(),
    deployDate: z.string(),
    deployTime: z.string(),
    deployTimeBe: z.string(),
    deployTimeFe: z.string(),
    envVault: z.string(),
    envVaultBe: z.string(),
    envVaultFe: z.string(),
    databaseTypes: z.array(z.string()),
    databaseName: z.string(),
    tableName: z.string(),
    columnName: z.string(),
    databaseDescription: z.string(),
    kafkaMessage: z.string(),
    kafkaConsumer: z.string(),
    kafkaProducer: z.string(),
    kafkaTopic: z.string(),
    services: z.array(
      z.object({
        id: z.string(),
        service: z.string(),
        url: z.string(),
      }),
    ),
  }),
});

export async function POST(request: Request) {
  try {
    const { input } = Body.parse(await request.json());

    const missing = missingRequiredFields(input);
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Lengkapi field wajib: ${missing.join(', ')}.`, missing },
        { status: 400 },
      );
    }

    const answers = buildFormAnswers(input);
    const { results } = await fillDeploymentFormInChrome(
      DEPLOYMENT_FORM_URL,
      answers,
    );

    return NextResponse.json({
      total: results.length,
      filled: results.filter((item) => item.ok).length,
      results,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
