import { useEffect, useState } from 'react';
import { ref, get, query, orderByChild, limitToLast, onChildAdded } from 'firebase/database';
import { realtimeDb } from '../../firebase.ts';
import styled from '@emotion/styled';

const INITIAL_PAGE_SIZE = 5; // Number of comments per page

const GuestbookList = () => {
  const [comments, setComments] = useState<Array<{ id: string; sender: string; message: string; date: string }>>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalComments, setTotalComments] = useState(0); // Total number of comments
  const [commentsPerPage] = useState(INITIAL_PAGE_SIZE);

  useEffect(() => {
    fetchTotalComments();
    fetchComments(currentPage);
    subscribeToNewComments();
  }, [currentPage]);

  const fetchTotalComments = async () => {
    const guestbookQuery = query(ref(realtimeDb, 'guestbook'));
    const snapshot = await get(guestbookQuery);
    if (snapshot.exists()) {
      setTotalComments(Object.keys(snapshot.val()).length); // Set the total number of comments
    }
  };

  const fetchComments = async (page: number) => {
    const startAt = (page - 1) * commentsPerPage;
    const guestbookQuery = query(
      ref(realtimeDb, 'guestbook'),
      orderByChild('createdAt'),
      limitToLast(startAt + commentsPerPage) // Fetch the required number of items
    );

    const snapshot = await get(guestbookQuery);
    if (snapshot.exists()) {
      const items = Object.entries(snapshot.val()).map(([key, val]: any) => ({
        id: key,
        ...val,
      }));

      const newComments = items.reverse(); // Reverse to show the latest comments at the bottom
      setComments(newComments.slice(startAt, startAt + commentsPerPage)); // Display comments for the current page
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const subscribeToNewComments = () => {
    const guestbookRef = query(ref(realtimeDb, 'guestbook'), orderByChild('createdAt'));
    onChildAdded(guestbookRef, (snapshot) => {
      const newComment = { id: snapshot.key, ...snapshot.val() };
      setComments((prev) => {
        if (!prev.some(comment => comment.id === newComment.id)) {
          return [newComment, ...prev];
        }
        return prev; // Return previous state if the comment is a duplicate
      });
      fetchTotalComments(); // Update total comments when a new comment is added
    });
  };

  const totalPages = Math.ceil(totalComments / commentsPerPage); // Calculate total pages

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
      <Pagination>
        {[...Array(totalPages)].map((_, index) => (
          <PageButton
            key={index + 1}
            onClick={() => handlePageChange(index + 1)}
            active={currentPage === index + 1}
          >
            {index + 1}
          </PageButton>
        ))}
      </Pagination>
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

const Pagination = styled.div`
  display: flex;
  justify-content: center; /* Center the pagination buttons */
  gap: 5px;
  margin-top: 10px;
`;


const PageButton = styled.button<{ active?: boolean }>`
  padding: 8px 12px;
  border-radius: 5px;
  border: none;
  background-color: ${({ active }) => (active ? '#007bff' : '#e0e0e0')};
  color: ${({ active }) => (active ? 'white' : '#000')};
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #0056b3;
    color: white;
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

export default GuestbookList;
