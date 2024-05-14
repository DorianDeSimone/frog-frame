import React, { useEffect } from 'react'

const ClientComp = () => {
  useEffect(() => {
    console.log("mounted")
  }, [])
  
  return (
    <div>
      
    </div>
  )
}

export default ClientComp
