import { useMemo } from 'react';

export const usePagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  siblingCount = 1 
}) => {
  const paginationRange = useMemo(() => {
    const totalPageNumbers = siblingCount + 5;

    if (totalPageNumbers >= totalPages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 2;

    const firstPageIndex = 1;
    const lastPageIndex = totalPages;

    if (!shouldShowLeftDots && shouldShowRightDots) {
      let leftItemCount = 3 + 2 * siblingCount;
      let leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
      return [...leftRange, '...', totalPages];
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      let rightItemCount = 3 + 2 * siblingCount;
      let rightRange = Array.from(
        { length: rightItemCount },
        (_, i) => totalPages - rightItemCount + i + 1
      );
      return [firstPageIndex, '...', ...rightRange];
    }

    if (shouldShowLeftDots && shouldShowRightDots) {
      let middleRange = Array.from(
        { length: rightSiblingIndex - leftSiblingIndex + 1 },
        (_, i) => leftSiblingIndex + i
      );
      return [firstPageIndex, '...', ...middleRange, '...', lastPageIndex];
    }
  }, [currentPage, totalPages, siblingCount]);

  const canPreviousPage = currentPage > 1;
  const canNextPage = currentPage < totalPages;

  const previousPage = () => {
    if (canPreviousPage) {
      onPageChange(currentPage - 1);
    }
  };

  const nextPage = () => {
    if (canNextPage) {
      onPageChange(currentPage + 1);
    }
  };

  return {
    pages: paginationRange,
    canPreviousPage,
    canNextPage,
    previousPage,
    nextPage
  };
};
