import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react'

const MentionList = forwardRef((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0)

  const selectItem = index => {
    const item = props.items[index]
    if (item) {
      props.command({ id: item })
    }
  }

  const upHandler = () => {
    setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length)
  }

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length)
  }

  const enterHandler = () => {
    selectItem(selectedIndex)
  }

  useEffect(() => setSelectedIndex(0), [props.items])

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === 'ArrowUp') {
        upHandler()
        return true
      }

      if (event.key === 'ArrowDown') {
        downHandler()
        return true
      }

      if (event.key === 'Enter') {
        enterHandler()
        return true
      }

      return false
    },
  }))

  return (
    <div className="bg-base-100 border border-base-content/10 shadow-xl rounded-xl overflow-hidden min-w-[150px]">
      {props.items.length ? (
        props.items.map((item, index) => (
          <button
            className={`w-full text-left px-3 py-2 text-sm transition-colors ${
              index === selectedIndex
                ? 'bg-primary text-primary-content'
                : 'hover:bg-base-200 text-base-content'
            }`}
            key={index}
            onClick={() => selectItem(index)}
            type="button"
          >
            {item}
          </button>
        ))
      ) : (
        <div className="px-3 py-2 text-sm text-base-content/50 italic">No se encontraron resultados</div>
      )}
    </div>
  )
})

MentionList.displayName = 'MentionList'

export default MentionList
