import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export function useAdminSchools() {
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api<any[]>('/escolas').then((r) => setSchools(r)).catch(() => setSchools([])).finally(() => setLoading(false));
  }, []);
  return { schools, loading };
}

export function useSelectedSchool() {
  const [schoolId, setSchoolId] = useState<string | ''>(() => localStorage.getItem('admin_school_id') || '');
  const update = (id: string) => { setSchoolId(id); localStorage.setItem('admin_school_id', id); };
  return { schoolId, setSchoolId: update };
}

