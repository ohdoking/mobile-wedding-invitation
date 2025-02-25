import { useEffect, useState } from 'react';
import { ref, get, query, orderByChild, limitToLast, onChildAdded } from 'firebase/database';
import { realtimeDb } from '../../firebase.ts';
import styled from '@emotion/styled';

const PAGE_SIZE = 10;

const GuestbookList = () => {
  const [comments, setComments] = useState<Array<{ id: string; sender: string; message: string; date: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [lastKey, setLastKey] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchInitialComments();
    subscribeToNewComments();
  }, []);

  const fetchInitialComments = async () => {
    setLoading(true);
    const guestbookQuery = query(ref(realtimeDb, 'guestbook'), orderByChild('createdAt'), limitToLast(PAGE_SIZE + 1));

    const snapshot = await get(guestbookQuery);
    if (snapshot.exists()) {
      const items = Object.entries(snapshot.val()).map(([key, val]: any) => ({
        id: key,
        ...val,
      }));

      const newLastKey = items.length > PAGE_SIZE ? items[0].id : null;
      setLastKey(newLastKey);
      setComments(items.slice(-PAGE_SIZE)); // Keep only the latest 10 items
      setHasMore(newLastKey !== null);
    } else {
      setHasMore(false);
    }
    setLoading(false);
  };

  const loadMore = async () => {
    if (!lastKey || loading) return;
    setLoading(true);

    const guestbookQuery = query(ref(realtimeDb, 'guestbook'), orderByChild('createdAt'), limitToLast(PAGE_SIZE + 1));

    const snapshot = await get(guestbookQuery);
    if (snapshot.exists()) {
      const items = Object.entries(snapshot.val()).map(([key, val]: any) => ({
        id: key,
        ...val,
      }));

      const newLastKey = items.length > PAGE_SIZE ? items[0].id : null;
      setLastKey(newLastKey);
      // Add new items only if they are not already in comments
      setComments((prev) => {
        const existingIds = new Set(prev.map(comment => comment.id));
        const newComments = items.slice(-PAGE_SIZE).filter(comment => !existingIds.has(comment.id));
        return [...newComments, ...prev];
      });
      setHasMore(newLastKey !== null);
    }
    setLoading(false);
  };

  const subscribeToNewComments = () => {
    const guestbookRef = query(ref(realtimeDb, 'guestbook'), orderByChild('createdAt'));
    onChildAdded(guestbookRef, (snapshot) => {
      const newComment = { id: snapshot.key, ...snapshot.val() };
      // Only add the new comment if it doesn't already exist
      setComments((prev) => {
        if (!prev.some(comment => comment.id === newComment.id)) {
          return [newComment, ...prev];
        }
        return prev; // Return previous state if the comment is a duplicate
      });
    });
  };

  return (
    <GuestbookContainer>
      {comments.map((comment) => (
        <Comment key={comment.id}>
          <CommentHeader>
            <Sender>{comment.sender}</Sender>
            <Date>{comment.date}</Date>
          </CommentHeader>
          <Content>{comment.message}</Content>
        </Comment>
      ))}
      {hasMore && (
        <LoadMoreButton onClick={loadMore} disabled={loading}>
          {loading ? 'Loading...' : 'Load More'}
        </LoadMoreButton>
      )}
    </GuestbookContainer>
  );
};

const GuestbookContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 85%;
  margin: 0 auto;
  padding: 20px;
  border: 1px solid #eaeaea;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
`;

const Comment = styled.div`
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  background: #f9f9f9;
`;

const CommentHeader = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
`;

const Sender = styled.b`
  font-size: 16px;
  font-weight: bold;
`;

const Date = styled.small`
  font-size: 12px;
  color: #888;
`;

const Content = styled.p`
  margin: 0;
  font-size: 14px;
`;

const LoadMoreButton = styled.button`
  padding: 8px 12px;
  border-radius: 5px;
  border: none;
  background-color: #007bff;
  color: white;
  cursor: pointer;
  margin-top: 10px;
  transition: background-color 0.3s;

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }

  &:not(:disabled):hover {
    background-color: #0056b3;
  }
`;

export default GuestbookList;
