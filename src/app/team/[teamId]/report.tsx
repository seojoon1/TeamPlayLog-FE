import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { View } from 'react-native';

import { Avatar, Badge, Button, Card, Empty, ErrorText, Field, Loading, Notice, Row, Screen, Txt } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { RECORD_TYPE_SHORT, shortDate } from '@/lib/format';
import { useMyMember, useReports, useTeamId } from '@/lib/hooks';
import { openReportPdf } from '@/lib/pdf';
import type { RecordType, Report, ReportEntry, ReportMember } from '@/lib/types';
import { C, S } from '@/theme';

/** S-10 기여 리포트 (팀의 가장 최근 리포트) */
export default function ReportScreen() {
  const teamId = useTeamId();
  const qc = useQueryClient();
  const reports = useReports(teamId);
  const me = useMyMember(teamId);
  const [objection, setObjection] = useState('');
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const rep = reports.data?.[0];
  const leader = me?.role === 'LEADER';

  const done = () => qc.invalidateQueries({ queryKey: ['reports', teamId] });
  const create = useMutation({ mutationFn: () => api<Report>(`/teams/${teamId}/reports`, { method: 'POST', body: {} }), onSuccess: done });
  const view = useMutation({
    mutationFn: () => api<Report>(`/reports/${rep!.id}/views`, { method: 'POST', body: objection.trim() ? { objection: objection.trim() } : {} }),
    onSuccess: () => {
      setObjection('');
      done();
    },
  });
  const submit = useMutation({ mutationFn: () => api<Report>(`/reports/${rep!.id}/submit`, { method: 'POST' }), onSuccess: done });
  const err = [create.error, view.error, submit.error].find((e) => e instanceof ApiError) as ApiError | undefined;

  if (reports.isLoading) {
    return (
      <Screen title="기여 리포트">
        <Loading />
      </Screen>
    );
  }
  if (!rep) {
    return (
      <Screen title="기여 리포트" footer={<Button grow icon="document-text-outline" label="리포트 만들기" loading={create.isPending} onPress={() => create.mutate()} />}>
        <Empty icon="document-text-outline" title="아직 리포트가 없어요" body="지금까지 확인된 기록을 팀원별로 모아 리포트를 만들어요. 만들면 팀원 모두에게 열람 요청이 가요." />
        <ErrorText message={err?.message} />
      </Screen>
    );
  }

  const myView = rep.views.find((v) => v.member_id === me?.member_id);
  const viewed = rep.views.filter((v) => v.viewed_at).length;
  const draft = rep.status === 'DRAFT';

  async function pdf() {
    setPdfBusy(true);
    setPdfError(null);
    try {
      await openReportPdf(rep!.id, rep!.serial_no);
    } catch {
      setPdfError('PDF를 열지 못했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setPdfBusy(false);
    }
  }

  let primary;
  if (!draft) primary = <Button grow icon="checkmark" label="제출됨" disabled onPress={() => {}} />;
  else if (!myView?.viewed_at) primary = <Button grow icon="checkmark" label="열람 완료" loading={view.isPending} onPress={() => view.mutate()} />;
  else if (leader) primary = <Button grow icon="paper-plane-outline" label="제출하기" disabled={!rep.can_submit} loading={submit.isPending} onPress={() => submit.mutate()} />;
  else primary = <Button grow icon="checkmark" label="열람했어요" disabled onPress={() => {}} />;

  return (
    <Screen
      title="기여 리포트"
      gap={S.md}
      right={draft && leader ? <Button small kind="ghost" label="새로 만들기" loading={create.isPending} onPress={() => create.mutate()} /> : undefined}
      footer={
        <>
          <Button kind="ghost" icon="document-text-outline" label="PDF" loading={pdfBusy} onPress={pdf} />
          {primary}
        </>
      }>
      <Card style={{ gap: 10 }}>
        <Row>
          <Txt t="sm" style={{ flex: 1 }}>
            {rep.serial_no} · {shortDate(rep.period_from)} ~ {shortDate(rep.period_to)}
          </Txt>
          <Badge label={draft ? '제출 전' : '제출됨'} tone={draft ? 'warn' : 'ok'} />
        </Row>
        <Row gap={6}>
          {rep.views.map((v) => (
            <Avatar key={v.member_id} name={v.display_name} seed={v.member_id} ghost={!v.viewed_at} />
          ))}
          <Txt t="sm" style={{ paddingLeft: 6 }}>
            {rep.views.length}명 중 {viewed}명 열람
          </Txt>
        </Row>
        <Txt t="tiny">
          {draft
            ? rep.submit_blocked_reason && leader
              ? rep.submit_blocked_reason
              : '팀원 전원이 열람하면 조장이 제출할 수 있어요. 48시간이 지나면 미열람 표시와 함께 제출돼요.'
            : `${shortDate(rep.submitted_at!)}에 제출했어요. 내용은 더 이상 바뀌지 않아요.`}
        </Txt>
      </Card>

      <Notice>기록의 개수는 기여의 크기가 아니에요. 앱은 점수나 순위를 매기지 않아요.</Notice>

      {rep.content.members.map((m) => (
        <MemberBlock key={m.member_id} m={m} />
      ))}

      {rep.views.some((v) => v.objection) ? (
        <Card style={{ gap: 6 }}>
          <Txt t="sec">이의 의견</Txt>
          {rep.views
            .filter((v) => v.objection)
            .map((v) => (
              <Txt key={v.member_id} t="body">
                {v.display_name}: {v.objection}
              </Txt>
            ))}
        </Card>
      ) : null}

      {draft && !myView?.viewed_at ? (
        <Field label="이의 의견 (선택)" value={objection} onChangeText={setObjection} maxLength={100} placeholder="빠진 기록이 있다면 한 줄로 남겨 주세요" />
      ) : null}
      <ErrorText message={err?.message ?? pdfError} />
    </Screen>
  );
}

function MemberBlock({ m }: { m: ReportMember }) {
  const flat = (g: Record<RecordType, ReportEntry[]>) => (Object.keys(g) as RecordType[]).flatMap((t) => g[t].map((e) => ({ t, e })));
  const ok = flat(m.confirmed);
  const not = flat(m.unconfirmed);
  return (
    <Card style={{ gap: 6 }}>
      <Row gap={10} style={{ paddingBottom: 4 }}>
        <Avatar name={m.name} seed={m.member_id} />
        <Txt t="b" style={{ flex: 1 }}>
          {m.name}
          {m.left ? <Txt t="sm"> (팀을 나감)</Txt> : null}
        </Txt>
        {ok.length === 0 && not.length === 0 ? <Txt t="tiny">기록 없음</Txt> : <Ionicons name="checkmark-done" size={18} color={C.mute} />}
      </Row>
      {ok.map(({ t, e }) => (
        <Entry key={e.record_id} t={t} e={e} />
      ))}
      {not.length ? (
        <Txt t="tiny" style={{ paddingTop: 6 }}>
          확인되지 않은 기록
        </Txt>
      ) : null}
      {not.map(({ t, e }) => (
        <Entry key={e.record_id} t={t} e={e} dim />
      ))}
    </Card>
  );
}

function Entry({ t, e, dim }: { t: RecordType; e: ReportEntry; dim?: boolean }) {
  const extra = [e.late ? '사후 기록' : null, e.no_output ? '설명만' : null].filter(Boolean).join(' · ');
  return (
    <Row gap={S.sm} style={{ paddingVertical: 6 }} align="flex-start">
      <Badge label={RECORD_TYPE_SHORT[t]} tone={dim ? 'muted' : 'brand'} />
      <View style={{ flex: 1 }}>
        <Txt t="body" color={dim ? C.sub : C.text}>
          {e.note ?? e.task ?? '기록'}
        </Txt>
        {extra || e.confirmed_by.length ? (
          <Txt t="tiny">{[extra, e.confirmed_by.length ? `확인: ${e.confirmed_by.join(', ')}` : ''].filter(Boolean).join(' · ')}</Txt>
        ) : null}
      </View>
      <Txt t="tiny">{shortDate(e.date)}</Txt>
    </Row>
  );
}
