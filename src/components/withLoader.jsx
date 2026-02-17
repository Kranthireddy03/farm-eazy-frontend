import React, { useState, useEffect } from 'react';
import Loader from './Loader';

/**
 * HOC to wrap a component with a global loader.
 * Pass a `loading` prop to control loader visibility.
 */
const withLoader = (WrappedComponent) => {
  return function LoaderWrapper(props) {
    const { loading, ...rest } = props;
    return loading ? <Loader /> : <WrappedComponent {...rest} />;
  };
};

export default withLoader;
