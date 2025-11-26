import React from 'react'

interface buttonProps {
    title: string,
    onClick: () => void,
    disable?: boolean
}

function Button(props: buttonProps) {
  return (
    <button onClick={() => props.onClick()}>
        {props.title}
    </button>
  )
}

export default Button