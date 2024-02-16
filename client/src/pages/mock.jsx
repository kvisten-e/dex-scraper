const handleSearch = (valueButton) => {
  const updatedSearches = [...latestSearch];
  const index = updatedSearches.indexOf(address);
  if (index !== -1) {
    updatedSearches.splice(index, 1);
  }
  updatedSearches.unshift(address);
  if (updatedSearches.length > 5) {
    updatedSearches.pop();
  }

  const params = new URLSearchParams({
    param1: '1000',
    param2: '5',
    param3: '2',
    param4: '3'
  });
  if (valueButton == null) {
    navigate(`/address/${address}?${params.toString()}`);
  } else {
    navigate(`/address/${valueButton}?${params.toString()}`);
  }

  setLatestSearch(updatedSearches);
  setAddress('');
};