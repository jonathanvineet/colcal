'use client'

export default function NotesExplorerCard({
  query,
  onQueryChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  sortBy,
  onSortByChange,
  teamOptions,
  authorOptions,
  selectedTeams,
  selectedAuthors,
  onToggleTeam,
  onToggleAuthor,
  onClearFilters,
  totalResults,
  page,
  pageSize,
  paginatedNotes,
  onPrevPage,
  onNextPage,
  onOpenNote,
  formatDateKey,
  formatTimestamp,
}) {
  const startItem = totalResults === 0 ? 0 : (page - 1) * pageSize + 1
  const endItem = totalResults === 0 ? 0 : Math.min(page * pageSize, totalResults)
  const hasPrev = page > 1
  const hasNext = endItem < totalResults

  return (
    <div className="notes-explorer">
      <div className="notes-explorer-head">
        <h4 className="notes-explorer-title">Notes Explorer</h4>
        <button type="button" className="notes-clear-btn" onClick={onClearFilters}>
          Clear Filters
        </button>
      </div>

      <div className="notes-filter-grid">
        <input
          type="text"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search note text, team, or author"
          aria-label="Search notes"
        />
        <input
          type="date"
          value={dateFrom}
          onChange={(event) => onDateFromChange(event.target.value)}
          aria-label="Filter from date"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(event) => onDateToChange(event.target.value)}
          aria-label="Filter to date"
        />
        <select
          value={sortBy}
          onChange={(event) => onSortByChange(event.target.value)}
          aria-label="Sort notes"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
      </div>

      <div className="notes-chip-section">
        <div className="notes-chip-label">Team</div>
        <div className="notes-chip-row">
          {teamOptions.map((team) => (
            <button
              key={team}
              type="button"
              className={`notes-chip ${selectedTeams.includes(team) ? 'is-active' : ''}`}
              onClick={() => onToggleTeam(team)}
            >
              {team}
            </button>
          ))}
        </div>
      </div>

      <div className="notes-chip-section">
        <div className="notes-chip-label">Author</div>
        <div className="notes-chip-row">
          {authorOptions.map((author) => (
            <button
              key={author}
              type="button"
              className={`notes-chip ${selectedAuthors.includes(author) ? 'is-active' : ''}`}
              onClick={() => onToggleAuthor(author)}
            >
              {author}
            </button>
          ))}
        </div>
      </div>

      <div className="notes-results-head">
        <span className="muted small">Showing {startItem}-{endItem} of {totalResults}</span>
        <div className="notes-pagination">
          <button type="button" onClick={onPrevPage} disabled={!hasPrev}>Prev</button>
          <span className="muted small">Page {page}</span>
          <button type="button" onClick={onNextPage} disabled={!hasNext}>Next</button>
        </div>
      </div>

      {paginatedNotes.length > 0 ? (
        <div className="notes-results-list">
          {paginatedNotes.map((entry) => (
            <div key={entry.id} className="notes-result-item">
              <div style={{ minWidth: 0 }}>
                <div className="notes-result-meta">
                  {formatDateKey(entry.dateKey)} • {entry.authorName} • {entry.team}
                </div>
                <div className="notes-result-submeta">{formatTimestamp(entry.savedAt)}</div>
                <div className="notes-result-text">{entry.text}</div>
              </div>
              <button
                type="button"
                onClick={() => onOpenNote(entry.dateKey, entry.text)}
                className="notes-open-btn"
              >
                Open
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="muted" style={{ margin: 0 }}>
          No notes match your current filters.
        </p>
      )}
    </div>
  )
}
