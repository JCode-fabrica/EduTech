import React from 'react';
import { useAdminSchools, useSelectedSchool } from '../admin/useAdminSchool';

export default function SchoolPicker({ onChange }: { onChange?: (id: string) => void }) {
  const { schools, loading } = useAdminSchools();
  const { schoolId, setSchoolId } = useSelectedSchool();
  return (
    <div className="row">
      <label className="label">Escola</label>
      <select className="select" value={schoolId} onChange={(e) => { setSchoolId(e.target.value); onChange?.(e.target.value); }}>
        <option value="">Selecione...</option>
        {!loading && schools.map((s) => (
          <option key={s.id} value={s.id}>{s.nome}</option>
        ))}
      </select>
    </div>
  );
}

