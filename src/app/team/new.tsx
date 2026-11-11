import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { DateField } from '@/components/date-field';
import { Button, Chip, ErrorText, Field, Notice, Screen, Section } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import type { Team } from '@/lib/types';
import { S } from '@/theme';

/** S-03 팀 만들기 (조장) */
export default function NewTeam() {
  const qc = useQueryClient();
  const [course, setCourse] = useState('');
  const [project, setProject] = useState('');
  const [due, setDue] = useState<string | null>(null);
  const [max, setMax] = useState(4);
  const create = useMutation({
    mutationFn: () => api<Team>('/teams', { method: 'POST', body: { course_name: course.trim(), project_name: project.trim(), final_due_at: due, max_members: max } }),
    onSuccess: (t) => {
      qc.invalidateQueries({ queryKey: ['teams'] });
      router.replace(`/team/${t.id}/more`);
    },
  });

  return (
    <Screen
      title="팀 만들기"
      footer={<Button label="팀 만들기" icon="checkmark" onPress={() => create.mutate()} loading={create.isPending} disabled={!course.trim() || !project.trim() || !due} grow />}>
      <Field label="과목명" value={course} onChangeText={setCourse} placeholder="예: 모바일프로그래밍" maxLength={50} />
      <Field label="과제 이름" value={project} onChangeText={setProject} placeholder="예: 중간 발표" maxLength={50} />
      <DateField label="최종 마감" value={due} onChange={setDue} days={60} />
      <Section title="최대 인원">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: S.sm }}>
          {[2, 3, 4, 5, 6, 7, 8].map((n) => (
            <Chip key={n} label={`${n}명`} selected={max === n} onPress={() => setMax(n)} />
          ))}
        </View>
      </Section>
      <Notice icon="people-outline">팀을 만들면 조장이 되고, 6자리 초대 코드가 생겨요. 코드는 ‘팀’ 탭에서 다시 볼 수 있어요.</Notice>
      <ErrorText message={create.error instanceof ApiError ? create.error.message : null} />
    </Screen>
  );
}
