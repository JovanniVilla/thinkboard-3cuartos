import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const MarkdownRenderer = ({ content = "", className = "" }) => {
  return (
    <div
      className={`prose prose-sm sm:prose-base break-words max-w-none text-base-content/90 
      prose-headings:text-base-content prose-headings:font-bold prose-headings:mb-2 prose-headings:mt-4 first:prose-headings:mt-0
      prose-a:text-primary prose-a:font-medium prose-a:no-underline hover:prose-a:underline
      prose-strong:text-base-content prose-strong:font-semibold
      prose-code:text-primary prose-code:bg-base-300/60 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:text-xs
      prose-pre:bg-base-300 prose-pre:text-base-content prose-pre:p-3 prose-pre:rounded-xl prose-pre:border prose-pre:border-base-content/10
      prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-base-200/50 prose-blockquote:px-4 prose-blockquote:py-2 prose-blockquote:rounded-r-lg prose-blockquote:italic prose-blockquote:text-base-content/80
      prose-ul:list-disc prose-ul:pl-5 prose-ol:list-decimal prose-ol:pl-5 prose-li:my-1
      prose-table:w-full prose-table:border-collapse prose-th:bg-base-200 prose-th:p-2 prose-th:text-left prose-th:border prose-th:border-base-content/15 prose-td:p-2 prose-td:border prose-td:border-base-content/15
      ${className}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          input: ({ type, checked, ...props }) => {
            if (type === "checkbox") {
              return (
                <input
                  type="checkbox"
                  checked={checked}
                  readOnly
                  className="checkbox checkbox-xs checkbox-primary mr-2 align-middle cursor-default"
                  {...props}
                />
              );
            }
            return <input type={type} {...props} />;
          },
        }}
      >
        {content || "_Sin contenido_"}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
