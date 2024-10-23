/* eslint-disable react/prop-types */

const Button = ({color,fn,classes,text}) => {

    const fnHandler = () =>{
        fn();
    }

  return (
    <div className={classes} style={{backgroundColor:color,zIndex:999}} onClick={fnHandler}>{text}</div>
  )
}

export default Button