import { useCallback, useEffect, useState } from 'react';
import { fetchConversations } from '../lib/chatApi';
import { isApiEnabled } from '../lib/api';

export function useConversations() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(() => {
    if (!isApiEnabled()) {
      setConversations([]);
      setError('백엔드 API(REACT_APP_API_URL)가 설정되지 않았습니다.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    fetchConversations()
      .then((data) => {
        setConversations(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || '채팅 목록을 불러올 수 없습니다.');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { conversations, loading, error, reload };
}
