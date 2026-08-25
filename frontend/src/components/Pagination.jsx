import "./Pagination.css";

export default function Pagination({ currentPage, totalPages, onPageChange }) {
    const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

    return (
        <div className="pagination">
            <button
                className="pagination__side-btn"
                disabled={currentPage === 1}
                onClick={() => onPageChange(currentPage - 1)}
            >
                ‹ Previous
            </button>

            <div className="pagination__center">
                <span>Page</span>
                <select
                    value={currentPage}
                    onChange={(e) => onPageChange(Number(e.target.value))}
                >
                    {pageNumbers.map((n) => (
                        <option key={n} value={n}>
                            {n}
                        </option>
                    ))}
                </select>
                <span>Of {totalPages}</span>
            </div>

            <button
                className="pagination__side-btn pagination__next"
                disabled={currentPage === totalPages}
                onClick={() => onPageChange(currentPage + 1)}
            >
                Next ›
            </button>
        </div>
    );
}