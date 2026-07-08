class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
    this.originalQueryString = { ...queryString };
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields', 'q', 'minPrice', 'maxPrice', 'category'];
    excludedFields.forEach((el) => delete queryObj[el]);

    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      let sortBy = this.queryString.sort;
      if (sortBy === 'popularity') sortBy = '-salesCount';
      else if (sortBy === 'newest') sortBy = '-createdAt';
      else if (sortBy === 'price_asc') sortBy = 'price';
      else if (sortBy === 'price_desc') sortBy = '-price';
      else if (sortBy === 'rating') sortBy = '-rating.average';
      else sortBy = sortBy.split(',').join(' ');

      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);
    return this;
  }

  textSearch(field, q) {
    if (q) {
      this.query = this.query.find({ $text: { $search: q } });
    }
    return this;
  }

  priceRange() {
    if (this.originalQueryString.minPrice || this.originalQueryString.maxPrice) {
      const priceFilter = {};
      if (this.originalQueryString.minPrice) priceFilter.$gte = Number(this.originalQueryString.minPrice);
      if (this.originalQueryString.maxPrice) priceFilter.$lte = Number(this.originalQueryString.maxPrice);
      this.query = this.query.find({ price: priceFilter });
    }
    return this;
  }
}

export default APIFeatures;
