/**
 * The save controls for one section.
 *
 * Sticky at the bottom of the form, and only interactive once something has
 * actually changed. A Save that is always enabled invites the click that
 * re-submits identical values — harmless in itself, but it writes an audit
 * entry for a change nobody made, and an audit trail full of no-ops is an audit
 * trail nobody reads.
 *
 * The dirty state is announced, not merely tinted: "3 unsaved changes" in a
 * live region tells a screen-reader user what the enabled button means.
 */
export default function SettingsSaveBar({ isDirty, dirtyCount = 0, processing, onReset }) {
  return (
    <div className="sticky bottom-0 -mx-5 mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 bg-white/95 px-5 py-3 backdrop-blur sm:-mx-6 sm:px-6">
      <p className="text-xs text-gray-500" aria-live="polite">
        {isDirty
          ? `${dirtyCount} unsaved change${dirtyCount === 1 ? "" : "s"}`
          : "All changes saved"}
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onReset}
          disabled={!isDirty || processing}
          className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent"
        >
          Discard
        </button>
        <button
          type="submit"
          disabled={!isDirty || processing}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {processing ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}
